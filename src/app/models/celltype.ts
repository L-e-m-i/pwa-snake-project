export interface CellType {
  type: 'empty' | 'snake' | 'food' | 'obstacle';
  isHead?: boolean;
}
