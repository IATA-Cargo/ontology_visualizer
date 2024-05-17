import { markdown } from "../helpers";
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
          SQL Schema Visualizer
        </h1>

        <div className="info-popup__body">
          <p dangerouslySetInnerHTML={{__html: markdown("Hey :wave: The SQL Schema Visualiser is an open source project, it is built with [React Flow](https://reactflow.dev/). I bet in 20 minutes you can visualize your own schema! :boom: Check out [the README file on Github](https://github.com/sqlhabit/sql_schema_visualisation#readme) for instructions how to do it.") }} />

          <p dangerouslySetInnerHTML={{__html: markdown("The schema you're looking at belongs to a fictional startup called Bindle and featured in [the SQL Habit course](https://www.sqlhabit.com).") }} />

          <h2>Shortcuts</h2>

          <p>
            <strong>SHIFT + hover</strong> over a table node or a column name to see the description.
          </p>

          <p className="mb-32">
            <strong>Hover over a table node</strong> to highlight all incoming and outgoing edges.
          </p>

          <h2>Legend</h2>
          <table className="info-popup__table">
            <tr>
              <th>Scope colors</th>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#D0D0D0" }}>Embedded</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#BCCEF5" }}>Core</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#F8D8C3" }}>Abstract</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#FBE187" }}>Service</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#DCD9F8" }}>Common</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#A9E6E3" }}>Activity</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#C19694" }}>Event</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#A2EDCD" }}>Action</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#C5D084" }}>Billing & Settlement</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#78A471" }}>Distribution</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#E6BEDD" }}>Agent</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#FFA8B8" }}>Dangerous Goods</td>
            </tr>
            <tr>
              <td style={{ backgroundColor: "#D2C897" }}>Live Animals</td>
            </tr>
        </table>
          
          <p dangerouslySetInnerHTML={{__html: markdown("Made with :heart: by [Anatoli Makarevich](https://twitter.com/makaroni4).") }} />
        </div>
      </div>
    </div>
  );
};
