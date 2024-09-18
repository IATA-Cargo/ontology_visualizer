import { useState, FC, useEffect } from "react";
import { Handle, Position, NodeProps, FitViewOptions, useReactFlow } from "reactflow";
import { KeyIcon, ArrayIcon, CodelistIcon } from "../components";
import { markdown, markdownDescription } from "../helpers";

import "@reactflow/node-resizer/dist/style.css";

export const TableNode: FC<NodeProps> = ({ data }) => {
  const [selectedColumn, setSelectedColumn] = useState("");
  const [showDescription, setshowDescription] = useState(false);
  const [descriptionOnHoverActive, setDescriptionOnHoverActive] = useState(false);
  const [copyOnClickActive, setCopyOnClickActive] = useState(false);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setDescriptionOnHoverActive(true)
      }
      if (e.code === "ControlLeft" || e.code === "ControlRight") {
        setCopyOnClickActive(true)
      }
    }, false);

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setDescriptionOnHoverActive(false)
      }
      if (e.code === "ControlLeft" || e.code === "ControlRight") {
        setCopyOnClickActive(false)
      }
    }, false);

    
  }, []);

  return (
    <div className="table">
      <div
        style={{ backgroundColor: data.schemaColor }}
        className={copyOnClickActive ? "table__name table__nameHover" : "table__name"}
        onClick={() => {
          if(copyOnClickActive){
            navigator.clipboard.writeText(data.name)
          }
        }}
        onMouseEnter={() => {
          if (descriptionOnHoverActive) {
            setshowDescription(true)
          }
        }}
        onMouseLeave={() => setshowDescription(false)}>
        {data.name}

        <div
          className={showDescription ? "table__description table__description--active" : "table__description"}
          dangerouslySetInnerHTML={{ __html: markdown(data.description || "No description.") }} />
        {"target" && <Handle
          type="target"
          position={Position.Right}
          id={`${data.schema ? `${data.schema}.${data.name}` : `public.${data.name}`}-table-right`}
          className="right-handle source-handle"
        />}
        {"target" && <Handle
          type="target"
          position={Position.Left}
          id={`${data.schema ? `${data.schema}.${data.name}` : `public.${data.name}`}-table-left`}
          className="left-handle target-handle"
        />}
      </div>

      <div className="table__columns">
        {data.columns.map((column: any, index: any) => (
          <div
            key={index}
            className={selectedColumn === column.name ? "column-name column-name--selected" : "column-name"}
            onMouseEnter={() => {
              if (descriptionOnHoverActive) {
                setSelectedColumn(column.name)
              }
            }}
            onMouseLeave={() => setSelectedColumn("")}
          >
            {column.handleType && <Handle
              type={column.handleType}
              position={Position.Right}
              id={`${column.name}-right`}
              className={column.handleType === "source" ? "right-handle source-handle" : "right-handle target-handle"}
            />}
            {column.handleType && <Handle
              type={column.handleType}
              position={Position.Left}
              id={`${column.name}-left`}
              className={column.handleType === "source" ? "left-handle source-handle" : "left-handle target-handle"}
            />}

            <div className="column-name__inner">
              <div className={copyOnClickActive ? "column-name__name column-name__nameHover" : "column-name__name"}
                onClick={() => {
                  if(copyOnClickActive){
                    navigator.clipboard.writeText(column.name) 
                  }
                }}
              >
                {column.key && <KeyIcon />}
                {column.name}
                {column.array && <ArrayIcon />}

              </div>
              <div className={column.columnSubTypes ? "column-name__type subType" : "column-name__type"}
                onClick={() => {
                  if(column.codelist){
                    if(column.valueIRI){
                      window.open(column.valueIRI, '_blank')?.focus();
                    }                    
                  } else {
                    window.requestAnimationFrame(() => {

                      const fitViewOptions: FitViewOptions = {
                        duration: 500,
                        nodes: [{ id: column.schemaType + '.' + column.type }]
                      };
  
                      reactFlowInstance.fitView(fitViewOptions);
                    })
                  }
                }}
              >
                {column.type}{column.columnSubTypes ? '*' : ''}
                {column.codelist && <CodelistIcon />}
              </div>

              <div
                className="column-name__description"
                dangerouslySetInnerHTML={{ __html: markdownDescription(column.description, column.columnSubTypes) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
