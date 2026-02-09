export type FeasibilityFlag = {
  label: string;
  status: "green" | "yellow" | "red" | "unknown";
  detail: string;
};

export type LayerToggle = {
  id: string;
  label: string;
  group: string;
  active: boolean;
};

export type PropertyRecord = {
  id: string;
  address: string;
  city: string;
  state: string;
  jurisdiction: string;
  lat: number;
  lng: number;
  layers: LayerToggle[];
  feasibility: FeasibilityFlag[];
};

export const mockProperty: PropertyRecord = {
  id: "demo-1",
  address: "123 Snowfall Ridge",
  city: "Bend",
  state: "OR",
  jurisdiction: "Deschutes County",
  lat: 44.0582,
  lng: -121.3153,
  layers: [
    { id: "zoning", label: "Zoning", group: "Zoning", active: true },
    { id: "utilities", label: "Utilities", group: "Utilities", active: true },
    { id: "septic", label: "Septic & Soils", group: "Septic & Soils", active: false },
    { id: "wetlands", label: "Wetlands", group: "Environment", active: true },
    { id: "drainage", label: "Drainage / Slope", group: "Environment", active: false },
    { id: "flood", label: "Flood", group: "Hazards", active: true },
    { id: "hazards", label: "Hazards / Dangers", group: "Hazards", active: true }
  ],
  feasibility: [
    {
      label: "Zoning feasibility",
      status: "green",
      detail: "Appears to permit residential with ADU; confirm overlays."
    },
    {
      label: "Septic feasibility",
      status: "yellow",
      detail: "Soils suggest perc test recommended; verify with county."
    },
    {
      label: "Drainage / slope",
      status: "green",
      detail: "Gentle slope, low erosion risk."
    },
    {
      label: "Wetlands presence",
      status: "yellow",
      detail: "Mapped wetlands nearby; buffer review needed."
    },
    {
      label: "Flood exposure",
      status: "green",
      detail: "Outside FEMA SFHA; check local overlays."
    },
    {
      label: "Utilities availability",
      status: "yellow",
      detail: "Water likely; sewer unknown; power nearby."
    },
    {
      label: "Hazards nearby",
      status: "green",
      detail: "No major hazards mapped; verify locally."
    }
  ]
};





