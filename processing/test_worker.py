import tempfile, unittest
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from worker import process, validate_corners, detect

class ProcessingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_warp_preserves_printed_color_regions(self):
        cover = np.full((800, 560, 3), 210, np.uint8)
        cover[100:250,100:250] = [15,50,180]
        cv2.putText(cover,'BOOK 2026',(50,400),cv2.FONT_HERSHEY_SIMPLEX,1.7,(20,20,20),3)
        p = np.float32([[130,110],[740,160],[690,970],[90,920]])
        matrix = cv2.getPerspectiveTransform(np.float32([[0,0],[559,0],[559,799],[0,799]]),p)
        photo = cv2.warpPerspective(cover,matrix,(900,1100),borderValue=(40,40,40))
        source=self.root/'photo.png'; target=self.root/'corrected.png'
        Image.fromarray(cv2.cvtColor(photo,cv2.COLOR_BGR2RGB)).save(source)
        result=process({'source':str(source),'output':str(target),'corners':(p/[899,1099]).tolist(),'ratio':.7})
        image=cv2.imread(str(target)); h,w=image.shape[:2]
        self.assertAlmostEqual(w/h,.7,places=2)
        color=image[int(h*.2),int(w*.3)]
        self.assertTrue(np.max(np.abs(color.astype(float)-[15,50,180]))<8)
        self.assertGreater(result['sharpness'],0)
        self.assertEqual(source.read_bytes()[:8],b'\x89PNG\r\n\x1a\n')

    def test_detect_largest_quad(self):
        image=np.full((1000,800,3),30,np.uint8)
        cv2.fillConvexPoly(image,np.int32([[100,70],[700,100],[660,920],[60,900]]),(210,220,210))
        corners,found=detect(image)
        self.assertTrue(found)
        self.assertAlmostEqual(corners[0][0],.125,delta=.03)

    def test_crossed_corners_rejected(self):
        with self.assertRaises(ValueError): validate_corners([[0,0],[1,1],[1,0],[0,1]])

    def test_low_contrast_white_cover(self):
        image=np.full((1000,800,3),165,np.uint8)
        cv2.fillConvexPoly(image,np.int32([[100,80],[700,120],[670,920],[70,900]]),(190,190,190))
        corners,found=detect(image)
        self.assertTrue(found)
        self.assertAlmostEqual(corners[0][0],.125,delta=.03)
        self.assertAlmostEqual(corners[2][1],.92,delta=.03)

    def test_tiny_crop_rejected(self):
        with self.assertRaises(ValueError): validate_corners([[.1,.1],[.11,.1],[.11,.11],[.1,.11]])

    def test_detection_failure_warns_instead_of_inventing(self):
        source=self.root/'blank.png';target=self.root/'out.png'
        Image.new('RGB',(200,300),(128,128,128)).save(source)
        result=process({'source':str(source),'output':str(target)})
        self.assertTrue(any('Contorno' in w for w in result['warnings']))
        self.assertEqual(result['corners'],[[0,0],[1,0],[1,1],[0,1]])

if __name__=='__main__':unittest.main()
