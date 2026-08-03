import { SchemaColors } from "./SchemaColors";

export type DatabasePopupProps = {
  headline: string;
  subheadline?: string;
}

export type PopupProps = {
  onClose: Function;
  // The active database's palette, so the legend colours itself from the same
  // source the box headers use instead of a second hardcoded copy in SCSS.
  schemaColors?: SchemaColors;
}

export type DatabaseMenuPopupProps = DatabasePopupProps & PopupProps;
