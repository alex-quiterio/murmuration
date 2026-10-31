/**
 * Composition root — the only place that knows every layer and wires the
 * adapters to the ports. Impure inputs (clock, viewport) enter here.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { MurmurationService } from "@application";
import { InMemoryMurmurationRepository, SpatialHashIndexer } from "@infrastructure";
import { App } from "@presentation/App";
import "./styles.css";

const service = new MurmurationService(new InMemoryMurmurationRepository(), new SpatialHashIndexer());
service.gather({ width: window.innerWidth, height: window.innerHeight, seed: Date.now() });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App service={service} />
  </React.StrictMode>,
);
