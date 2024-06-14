# Ontology Visualizer

The Ontology Visualizer provides a way to visualize the ONE Record data model in a graphical format. This data model is part of the IATA ONE Record standard, which aims to create a common language and standardized data structure for sharing information in the air cargo industry via a secured API. You can access this tool [here](https://iata-cargo.github.io/ontology_visualizer/databases/cargo_full)

The Ontology Visualizer is a modified version of the sql_schema_visualizer by [sqlhabit](https://github.com/sqlhabit/sql_schema_visualizer).

# Features
Here a list of features included in the Ontology Visualizer:
- SHIFT + hover over a table node or a column name to see the description.
- Hover over a table node to highlight all incoming and outgoing edges.

# Databases
The Ontology Visualizer contains the following dataset:
- ONE Record Full Datamodel: Prototype visualization of the classes of the full ONE Record Data Model 3.0.1
- ONE Record Conceptual Datamodel : Prototype reduced visualization of the classes of the conceptual ONE Record Data Model 3.0.1

# Legend

- Embedded: Objects usually embedded into Logistic Objects
- Core: Objects essential for the transportation supply chain
- Service: Objects subtypes of LogisticsService
- Common: Common objects that are usually used linked to other Logistic Objects
- Abstract: Superclass not used as such, e.g. LogisticsObject
- Activity: Objects belonging to LogisticsActivity superclass
- Event: LogisticsEvents
- Billing & Settlement: Objects specifically used for Billing& Settlement purposes
- Distribution: Objects designed and used mostly for Distribution
- Agent: Objects part of LogisticsAgent superclass
- Dangerous Goods: Objects specifically used for transportation of Dangerous Goods as per the DGR
- Live Animals: Objects specifically used for transportation of Live Animals as per the LAR

