import { hydrateRoot } from "react-dom/client";
import EditorialSite from "./editorial-site";
import "./reset.css";

hydrateRoot(document.getElementById("root")!, <EditorialSite />);
