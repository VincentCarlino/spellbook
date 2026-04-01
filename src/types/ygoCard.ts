export interface YgoCard {
  id: number;
  name: string;
  type: string;
  race: string;
  desc?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  linkval?: number;
  linkmarkers?: string[];
  imageId: number;
}
