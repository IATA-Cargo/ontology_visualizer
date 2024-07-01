import { CloseIcon } from "../components";
import { PopupProps } from "../types";

export function InfoPopup(props: PopupProps) {


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
          <p>
          <div className="flex">
            <div className="tag embedded">Embedded</div>
            <div className="tagDescription"> Objects usually embedded into Logistic Objects</div>
          </div>
          <div className="flex">
            <div className="tag core">Core</div>
            <div className="tagDescription"> Objects essential for the transportation supply chain</div>
          </div>
          <div className="flex">
            <div className="tag service">Service</div>
            <div className="tagDescription"> Objects subtypes of LogisticsService</div>
          </div>
          <div className="flex">
            <div className="tag common">Common</div>
            <div className="tagDescription"> Common objects that are usually used linked to other Logistic Objects</div>
          </div>
          <div className="flex">
            <div className="tag abstract">Abstract</div>
            <div className="tagDescription"> Superclass not used as such, e.g. LogisticsObject</div>
          </div>
          <div className="flex">
            <div className="tag activity">Activity</div>
            <div className="tagDescription"> Objects belonging to LogisticsActivity superclass</div>
          </div>
          <div className="flex">
            <div className="tag event">Event</div>
            <div className="tagDescription"> LogisticsEvents</div>
          </div>
          <div className="flex">
            <div className="tag billing">Billing & Settlement</div>
            <div className="tagDescription"> Objects specifically used for Billing& Settlement purposes</div>
          </div>
          <div className="flex">
            <div className="tag distribution">Distribution</div>
            <div className="tagDescription"> Objects designed and used mostly for Distribution </div>
          </div>
          <div className="flex">
            <div className="tag agent">Agent</div>
            <div className="tagDescription"> Objects part of LogisticsAgent superclass</div>
          </div>
          <div className="flex">
            <div className="tag dangerGoods">Dangerous Goods</div>
            <div className="tagDescription"> Objects specifically used for transportation of Dangerous Goods as per the DGR</div>
          </div>
          <div className="flex">
            <div className="tag animals">Live Animals</div>
            <div className="tagDescription"> Objects specifically used for transportation of Live Animals as per the LAR</div>
          </div>
          </p>
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
      </div>
    </div>
  );
};
