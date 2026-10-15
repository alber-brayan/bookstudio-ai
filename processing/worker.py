"""Local image worker. One JSON request on stdin, one JSON response on stdout.
Corner coordinates are normalized TL, TR, BR, BL after EXIF orientation.
Never redraws printed pixels. No network access.
"""
import json, sys, math
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 60_000_000

def ordered(points):
    p = np.asarray(points, dtype=np.float32)
    center = p.mean(axis=0)
    p = p[np.argsort(np.arctan2(p[:, 1]-center[1], p[:, 0]-center[0]))]
    p = np.roll(p, -np.argmin(p.sum(axis=1)), axis=0)
    return p

def validate_corners(p):
    p = np.asarray(p, dtype=np.float32)
    if p.shape != (4, 2) or not np.isfinite(p).all() or (p<0).any() or (p>1).any():
        raise ValueError('Se necesitan cuatro esquinas dentro de la fotografía.')
    contour = p.reshape(-1, 1, 2)
    if not cv2.isContourConvex(contour) or abs(cv2.contourArea(contour)) < .02:
        raise ValueError('Las esquinas se cruzan o el área seleccionada es demasiado pequeña.')
    return p

def detect(image):
    h, w = image.shape[:2]
    scale = min(1, 1400/max(h, w))
    small = cv2.resize(image, None, fx=scale, fy=scale)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    area = small.shape[0]*small.shape[1]
    candidates = []
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # Low-contrast white covers need weaker edge thresholds. Convex hulls join
    # small gaps caused by page curvature without inventing printed content.
    for low, high in [(15, 45), (25, 70), (45, 130)]:
        edges = cv2.Canny(blurred, low, high)
        for kernel in (3, 9):
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((kernel, kernel), np.uint8))
            contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                if cv2.contourArea(c) < area*.16: continue
                hull = cv2.convexHull(c)
                for epsilon in (.015, .025, .04):
                    approx = cv2.approxPolyDP(hull, epsilon*cv2.arcLength(hull, True), True)
                    if len(approx) != 4 or not cv2.isContourConvex(approx): continue
                    a = cv2.contourArea(approx)
                    if a < area*.16 or a > area*.98: continue
                    points = ordered(approx.reshape(4, 2))/np.array([small.shape[1]-1, small.shape[0]-1])
                    candidates.append((a, points))
    if candidates:
        return np.clip(max(candidates, key=lambda x:x[0])[1], 0, 1), True
    return np.array([[0,0],[1,0],[1,1],[0,1]], dtype=np.float32), False

def process(req):
    source = Path(req['source']).resolve()
    output = Path(req['output']).resolve()
    with Image.open(source) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        if im.width*im.height > 60_000_000: raise ValueError('La foto supera 60 megapíxeles.')
        image = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    h, w = image.shape[:2]
    warnings = []
    if req.get('corners') is not None:
        corners = validate_corners(req['corners'])
    else:
        corners, found = detect(image)
        if not found: warnings.append('Contorno no identificado con confianza. Revisa las cuatro esquinas manualmente.')
    pixel = corners*np.array([w-1,h-1], dtype=np.float32)
    widths = [np.linalg.norm(pixel[1]-pixel[0]), np.linalg.norm(pixel[2]-pixel[3])]
    heights = [np.linalg.norm(pixel[3]-pixel[0]), np.linalg.norm(pixel[2]-pixel[1])]
    target_w = max(16, int(max(widths)))
    target_h = max(16, int(max(heights)))
    if req.get('ratio'):
        ratio = float(req['ratio'])
        if not .2 <= ratio <= 2: raise ValueError('Proporción no válida.')
        target_w = int(target_h*ratio)
    limit = min(1, 5000/max(target_w,target_h))
    target_w, target_h = int(target_w*limit), int(target_h*limit)
    matrix = cv2.getPerspectiveTransform(pixel.astype(np.float32), np.array([[0,0],[target_w-1,0],[target_w-1,target_h-1],[0,target_h-1]],np.float32))
    corrected = cv2.warpPerspective(image,matrix,(target_w,target_h),flags=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(corrected, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if sharpness<45: warnings.append('Posible desenfoque. Comprueba la legibilidad del texto.')
    if np.mean(np.all(corrected>248,axis=2))>.25: warnings.append('Zonas muy claras: podrían ser fondo blanco o reflejos. Revisa el producto.')
    if np.any((corners<.005)|(corners>.995)): warnings.append('El recorte toca el borde de la foto. Comprueba que el libro esté completo.')
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(cv2.cvtColor(corrected, cv2.COLOR_BGR2RGB)).save(output, 'PNG')
    return {'corners':corners.tolist(),'width':target_w,'height':target_h,'warnings':warnings,'sharpness':sharpness}

if __name__ == '__main__':
    try:
        print(json.dumps(process(json.load(sys.stdin)), ensure_ascii=True))
    except Exception as exc:
        print(json.dumps({'error':str(exc)}, ensure_ascii=True))
        sys.exit(1)
