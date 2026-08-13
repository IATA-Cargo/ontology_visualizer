import { CloseIcon } from "../components";
import { PopupProps } from "../types";
import legend from "../../config/legend.json";

export function InfoPopup(props: PopupProps) {
  const schemaColors = props.schemaColors || {};

  // Only show groups the current database actually contains, and take each
  // colour from the live palette so the legend can never drift from the boxes.
  const entries = legend.filter((entry) => schemaColors[entry.key]);

  return (
    <div
      className="info-popup">
      <div className="info-popup__inner">
        <CloseIcon
          className="info-popup__close-icon"
          onClick={() => { props.onClose() }} />

        <h1
          className="info-popup__headline">
          ONE Record Data Model Visualizer
        </h1>

        <div className="info-popup__body">
          <h2>Legend</h2>
          {entries.map((entry) => (
            <div className="flex" key={entry.key}>
              <div
                className="tag"
                style={{ backgroundColor: schemaColors[entry.key] }}>
                {entry.label}
              </div>
              <div className="tagDescription"> {entry.description}</div>
            </div>
          ))}
          <h2>Shortcuts</h2>
          <p>
            <strong>SHIFT + hover</strong> over a table node or a column name to see the description.
          </p>
          <p>
            <strong>CTRL + click</strong> over a table node or a column name to copy the text.
          </p>
          <p className="mb-32">
            <strong>Hover over a table node</strong> to highlight all incoming and outgoing edges.
          </p>
        </div>
        <div className="info-popup__footer">
          <div className="flex"><a href="https://www.iata.org/en/privacy/"><b>Privacy</b></a></div>
        </div>
      </div>
    </div>
  );
};
