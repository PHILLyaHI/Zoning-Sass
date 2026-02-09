// ============================================
// SITE CONSTRAINTS ENGINE
// ============================================
// Real-time evaluation of all site constraints for structure placement
// Includes: existing structures, septic, wells, utilities, environmental

import { PropertyRecord } from "./types";

// ============================================
// TYPES
// ============================================

export type ConstraintSeverity = "critical" | "warning" | "info" | "success";

export type ConstraintCategory = 
  | "setback" 
  | "septic" 
  | "well" 
  | "utility" 
  | "environmental" 
  | "structure" 
  | "permit"
  | "coverage";

export type RealTimeComment = {
  id: string;
  category: ConstraintCategory;
  severity: ConstraintSeverity;
  title: string;
  message: string;
  citation?: string;
  action?: string;
  structureId?: string;
};

export type ExistingFeature = {
  id: string;
  type: "house" | "garage" | "shed" | "septic_tank" | "drainfield" | "reserve_area" | "well" | "sewer_line" | "water_line" | "gas_line" | "electric_line" | "wetland" | "stream" | "flood_zone" | "driveway" | "easement" | "utility_easement" | "access_easement";
  label: string;
  x: number; // feet from left
  y: number; // feet from top
  width: number;
  height: number;
  rotation?: number;
  setbackRequired?: number; // feet required around this feature
  color: string;
  isEditable: boolean;
  // Additional easement info
  easementType?: "utility" | "access" | "drainage" | "conservation" | "scenic";
  easementWidth?: number;
  easementHolder?: string;
  restrictions?: string;
};

export type Easement = {
  id: string;
  type: "utility" | "access" | "drainage" | "conservation" | "scenic";
  holder: string; // e.g., "City of Seattle", "Puget Sound Energy", "Neighbor at 123 Oak St"
  width: number; // feet
  location: "front" | "side_left" | "side_right" | "rear" | "diagonal" | "interior";
  restrictions: string[];
  recordedDocument?: string; // e.g., "Recording #202312345"
};

export type PlacedStructure = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  bedrooms?: number;
  stories?: number;
};

export type SiteConstraints = {
  existingFeatures: ExistingFeature[];
  easements: Easement[];
  sewerAvailable: boolean;
  sewerDistanceFeet?: number;
  waterAvailable: boolean;
  waterDistanceFeet?: number;
  gasAvailable: boolean;
  electricAvailable: boolean;
  onSiteWell: boolean;
  wellLocation?: { x: number; y: number };
  neighborWellNearby: boolean;
  neighborWellDistance?: number;
  wetlandsPresent: boolean;
  floodZone: string | null;
  slopePercent: number;
  soilType: string;
  septicSuitability: "well_suited" | "somewhat_limited" | "very_limited" | "not_rated";
  hasDriveway: boolean;
  drivewayType?: "paved" | "gravel" | "concrete" | "dirt";
  drivewayWidth?: number;
};

export type PermitRequirement = {
  permitType: string;
  authority: string;
  estimatedFee: string;
  timeline: string;
  required: boolean;
  triggeredBy: string;
};

// ============================================
// MOCK SITE DATA GENERATOR
// ============================================

// Simple hash function to create a consistent seed from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator (consistent per property)
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

export function generateMockSiteConstraints(property: PropertyRecord): SiteConstraints {
  // Use actual lot dimensions if available, or estimate from area
  let lotWidth = property.lotWidth;
  let lotDepth = property.lotDepth;
  
  if (!lotWidth || !lotDepth) {
    // Estimate from area if available
    const area = property.areaSqft || 10000;
    const ratio = 0.5 + Math.random() * 0.5; // Random aspect ratio
    lotWidth = Math.floor(Math.sqrt(area * ratio));
    lotDepth = Math.floor(area / lotWidth);
  }
  
  // Create a unique seed from the full property ID + address + coordinates
  const seedSource = `${property.id}-${property.address || ""}-${property.centroid?.lat || 0}-${property.centroid?.lng || 0}`;
  const baseSeed = hashString(seedSource);
  
  // Generate consistent random values for this specific property
  const rand = (index: number) => seededRandom(baseSeed, index);
  
  // Different property types based on location and characteristics
  const isVacantLot = rand(0) > 0.7 || !property.areaSqft || property.areaSqft < 5000;
  const isRural = rand(1) > 0.5;
  const hasExistingHouse = !isVacantLot && rand(2) > 0.2;
  const hasSeptic = isRural || rand(3) > 0.4;
  const hasWell = isRural && rand(4) > 0.5;
  const hasGarage = hasExistingHouse && rand(5) > 0.3;
  const hasShed = hasExistingHouse && rand(6) > 0.6;
  const hasPool = !isRural && hasExistingHouse && rand(7) > 0.85;
  
  // Setbacks vary by zoning
  const frontSetback = 20 + Math.floor(rand(8) * 15); // 20-35 ft
  const sideSetback = 5 + Math.floor(rand(9) * 10); // 5-15 ft
  const rearSetback = 15 + Math.floor(rand(10) * 15); // 15-30 ft
  
  // House position and size (unique per property)
  const houseWidth = 25 + Math.floor(rand(11) * 35); // 25-60 ft
  const houseDepth = 20 + Math.floor(rand(12) * 30); // 20-50 ft
  
  // Position varies significantly based on property
  const houseXOffset = Math.floor(rand(13) * (lotWidth * 0.4));
  const houseYOffset = Math.floor(rand(14) * (lotDepth * 0.2));
  const houseX = sideSetback + houseXOffset;
  const houseY = frontSetback + houseYOffset;
  
  const existingFeatures: ExistingFeature[] = [];
  
  // Existing house (if developed property)
  if (hasExistingHouse) {
    existingFeatures.push({
      id: `house-${baseSeed}`,
      type: "house",
      label: "Existing House",
      x: houseX,
      y: houseY,
      width: houseWidth,
      height: houseDepth,
      setbackRequired: 10,
      color: "#64748b",
      isEditable: false,
    });
    
    // Possibly existing garage
    if (hasGarage) {
      const garageWidth = 18 + Math.floor(rand(40) * 12);
      const garageDepth = 18 + Math.floor(rand(41) * 10);
      const garageOnLeft = rand(42) > 0.5;
      const garageX = garageOnLeft
        ? Math.max(sideSetback, houseX - garageWidth - 3 - Math.floor(rand(43) * 8))
        : houseX + houseWidth + 3 + Math.floor(rand(44) * 8);
      
      existingFeatures.push({
        id: `garage-${baseSeed}`,
        type: "garage",
        label: "Garage",
        x: Math.max(sideSetback, Math.min(lotWidth - sideSetback - garageWidth, garageX)),
        y: houseY + Math.floor(rand(45) * 15),
        width: garageWidth,
        height: garageDepth,
        setbackRequired: 6,
        color: "#94a3b8",
        isEditable: false,
      });
    }
    
    // Possibly a shed
    if (hasShed) {
      // Shed in back of lot, random position
      const shedInBack = rand(46) > 0.3;
      const shedX = sideSetback + Math.floor(rand(47) * (lotWidth - 2 * sideSetback - 15));
      const shedY = shedInBack 
        ? lotDepth - rearSetback - 20 - Math.floor(rand(48) * 30)
        : houseY + houseDepth + 20 + Math.floor(rand(49) * 20);
      
      existingFeatures.push({
        id: `shed-${baseSeed}`,
        type: "shed",
        label: "Shed",
        x: shedX,
        y: Math.min(shedY, lotDepth - rearSetback - 15),
        width: 8 + Math.floor(rand(50) * 8),
        height: 8 + Math.floor(rand(51) * 8),
        setbackRequired: 3,
        color: "#a1a1aa",
        isEditable: false,
      });
    }
    
    // Possibly a pool (rare)
    if (hasPool) {
      const poolX = houseX + Math.floor(rand(52) * 20);
      const poolY = houseY + houseDepth + 10 + Math.floor(rand(53) * 15);
      existingFeatures.push({
        id: `pool-${baseSeed}`,
        type: "house", // Using house type since pool isn't defined
        label: "Pool",
        x: poolX,
        y: Math.min(poolY, lotDepth - rearSetback - 30),
        width: 15 + Math.floor(rand(54) * 10),
        height: 25 + Math.floor(rand(55) * 15),
        setbackRequired: 5,
        color: "#0ea5e9",
        isEditable: false,
      });
    }
  }
  
  // Septic system (if no sewer)
  if (hasSeptic && hasExistingHouse) {
    // Septic tank - typically behind/beside house, but position varies
    const tankSide = rand(60) > 0.5;
    const tankX = tankSide
      ? houseX + houseWidth + 8 + Math.floor(rand(61) * 20)
      : houseX - 15 - Math.floor(rand(62) * 10);
    const tankY = houseY + Math.floor(rand(63) * houseDepth) + 10;
    
    existingFeatures.push({
      id: `septic-${baseSeed}`,
      type: "septic_tank",
      label: "Septic Tank",
      x: Math.max(sideSetback, Math.min(tankX, lotWidth - sideSetback - 12)),
      y: Math.min(tankY, lotDepth - rearSetback - 60),
      width: 5 + Math.floor(rand(64) * 5),
      height: 3 + Math.floor(rand(65) * 3),
      setbackRequired: 10,
      color: "#7c3aed",
      isEditable: false,
    });
    
    // Drainfield - larger area behind tank, position varies
    const drainfieldX = Math.floor(rand(20) * (lotWidth * 0.3)) + sideSetback + 20;
    const drainfieldY = Math.floor(lotDepth * 0.4) + Math.floor(rand(21) * (lotDepth * 0.2));
    existingFeatures.push({
      id: `drainfield-${baseSeed}`,
      type: "drainfield",
      label: "Drainfield",
      x: Math.min(drainfieldX, lotWidth - sideSetback - 35),
      y: Math.min(drainfieldY, lotDepth - rearSetback - 50),
      width: 25 + Math.floor(rand(22) * 15),
      height: 35 + Math.floor(rand(23) * 20),
      setbackRequired: 20,
      color: "#a78bfa",
      isEditable: false,
    });
    
    // Reserve area - position varies per property
    const reserveX = sideSetback + Math.floor(rand(24) * (lotWidth * 0.2));
    const reserveY = Math.floor(lotDepth * 0.5) + Math.floor(rand(25) * (lotDepth * 0.25));
    existingFeatures.push({
      id: `reserve-${baseSeed}`,
      type: "reserve_area",
      label: "Reserve Area",
      x: reserveX,
      y: Math.min(reserveY, lotDepth - rearSetback - 40),
      width: 25 + Math.floor(rand(26) * 15),
      height: 25 + Math.floor(rand(27) * 15),
      setbackRequired: 10,
      color: "#c4b5fd",
      isEditable: false,
    });
  }
  
  // Well (if rural/no municipal water) - position varies
  if (hasWell) {
    // Well typically in front or side yard, away from septic
    const wellSide = rand(28) > 0.5;
    const wellX = wellSide 
      ? sideSetback + Math.floor(rand(29) * 20)
      : lotWidth - sideSetback - 10 - Math.floor(rand(30) * 20);
    const wellY = frontSetback + Math.floor(rand(31) * (lotDepth * 0.3));
    
    existingFeatures.push({
      id: `well-${baseSeed}`,
      type: "well",
      label: "Well",
      x: wellX,
      y: wellY,
      width: 4,
      height: 4,
      setbackRequired: 100, // 100' from septic drainfield
      color: "#0ea5e9",
      isEditable: false,
    });
  }
  
  // Utility lines (if urban/suburban)
  if (!hasSeptic) {
    existingFeatures.push({
      id: "sewer-line",
      type: "sewer_line",
      label: "Sewer Main",
      x: 0,
      y: 0,
      width: 2,
      height: lotDepth,
      setbackRequired: 5,
      color: "#16a34a",
      isEditable: false,
    });
  }
  
  // Water line (usually at street)
  existingFeatures.push({
    id: "water-line",
    type: "water_line",
    label: "Water Main",
    x: -5,
    y: 0,
    width: 2,
    height: 0, // Line runs along street
    setbackRequired: 0,
    color: "#3b82f6",
    isEditable: false,
  });
  
  // ============================================
  // DRIVEWAY
  // ============================================
  const hasDriveway = hasExistingHouse || rand(90) > 0.3; // Most developed properties have driveways
  const drivewayTypes = ["paved", "gravel", "concrete", "dirt"] as const;
  const drivewayType = drivewayTypes[Math.floor(rand(91) * 4)];
  const drivewayWidth = 10 + Math.floor(rand(92) * 8); // 10-18 feet wide
  
  if (hasDriveway) {
    // Driveway runs from street to house/garage
    const drivewayX = hasGarage 
      ? Math.max(sideSetback, Math.min(houseX + houseWidth / 2 - drivewayWidth / 2, lotWidth - sideSetback - drivewayWidth))
      : sideSetback + Math.floor(rand(93) * (lotWidth * 0.3));
    const drivewayLength = frontSetback + (hasGarage ? 10 : houseY);
    
    existingFeatures.push({
      id: `driveway-${baseSeed}`,
      type: "driveway",
      label: `Driveway (${drivewayType})`,
      x: drivewayX,
      y: 0, // Starts at street
      width: drivewayWidth,
      height: drivewayLength,
      setbackRequired: 0,
      color: drivewayType === "paved" || drivewayType === "concrete" ? "#6b7280" : "#a3a3a3",
      isEditable: false,
    });
  }

  // ============================================
  // EASEMENTS
  // ============================================
  const easements: Easement[] = [];
  
  // Utility easement (very common - ~70% of properties)
  const hasUtilityEasement = rand(94) > 0.3;
  if (hasUtilityEasement) {
    const utilityEasementWidth = 5 + Math.floor(rand(95) * 10); // 5-15 feet
    const easementLocation = rand(96) > 0.5 ? "front" : (rand(97) > 0.5 ? "side_left" : "side_right");
    
    easements.push({
      id: `utility-easement-${baseSeed}`,
      type: "utility",
      holder: rand(98) > 0.5 ? "Puget Sound Energy" : "Local Utility District",
      width: utilityEasementWidth,
      location: easementLocation as Easement["location"],
      restrictions: [
        "No permanent structures allowed",
        "Maintain clear access for utility maintenance",
        "No trees within easement area",
      ],
      recordedDocument: `Recording #${2020 + Math.floor(rand(99) * 5)}${Math.floor(rand(100) * 90000) + 10000}`,
    });
    
    // Add easement to map
    let easementX = 0, easementY = 0, easementW = 0, easementH = 0;
    if (easementLocation === "front") {
      easementX = 0;
      easementY = 0;
      easementW = lotWidth;
      easementH = utilityEasementWidth;
    } else if (easementLocation === "side_left") {
      easementX = 0;
      easementY = 0;
      easementW = utilityEasementWidth;
      easementH = lotDepth;
    } else {
      easementX = lotWidth - utilityEasementWidth;
      easementY = 0;
      easementW = utilityEasementWidth;
      easementH = lotDepth;
    }
    
    existingFeatures.push({
      id: `utility-easement-area-${baseSeed}`,
      type: "utility_easement",
      label: `Utility Easement (${utilityEasementWidth}')`,
      x: easementX,
      y: easementY,
      width: easementW,
      height: easementH,
      setbackRequired: 0,
      color: "#fbbf24",
      isEditable: false,
      easementType: "utility",
      easementWidth: utilityEasementWidth,
      easementHolder: easements[easements.length - 1].holder,
      restrictions: "No permanent structures",
    });
  }
  
  // Access easement (less common - ~20% of properties, usually flag lots or shared driveways)
  const hasAccessEasement = rand(101) > 0.8;
  if (hasAccessEasement) {
    const accessEasementWidth = 15 + Math.floor(rand(102) * 10); // 15-25 feet for vehicle access
    
    easements.push({
      id: `access-easement-${baseSeed}`,
      type: "access",
      holder: "Neighboring Property Owner",
      width: accessEasementWidth,
      location: rand(103) > 0.5 ? "side_left" : "side_right",
      restrictions: [
        "Shared driveway access",
        "Maintenance costs shared equally",
        "No blocking of access",
      ],
      recordedDocument: `Recording #${2015 + Math.floor(rand(104) * 10)}${Math.floor(rand(105) * 90000) + 10000}`,
    });
    
    const accessSide = easements[easements.length - 1].location;
    existingFeatures.push({
      id: `access-easement-area-${baseSeed}`,
      type: "access_easement",
      label: `Access Easement (${accessEasementWidth}')`,
      x: accessSide === "side_left" ? 0 : lotWidth - accessEasementWidth,
      y: 0,
      width: accessEasementWidth,
      height: Math.floor(lotDepth * 0.4), // Typically extends partway into lot
      setbackRequired: 0,
      color: "#f97316",
      isEditable: false,
      easementType: "access",
      easementWidth: accessEasementWidth,
      easementHolder: "Neighboring Property",
      restrictions: "Shared access - no blocking",
    });
  }
  
  // Drainage easement (uncommon - ~10% of properties)
  const hasDrainageEasement = rand(106) > 0.9;
  if (hasDrainageEasement) {
    const drainageWidth = 10 + Math.floor(rand(107) * 15);
    
    easements.push({
      id: `drainage-easement-${baseSeed}`,
      type: "drainage",
      holder: "County Stormwater District",
      width: drainageWidth,
      location: "rear",
      restrictions: [
        "No fill or grading allowed",
        "Natural drainage must be maintained",
        "No structures or impervious surfaces",
      ],
    });
    
    existingFeatures.push({
      id: `drainage-easement-area-${baseSeed}`,
      type: "easement",
      label: `Drainage Easement (${drainageWidth}')`,
      x: 0,
      y: lotDepth - drainageWidth,
      width: lotWidth,
      height: drainageWidth,
      setbackRequired: 0,
      color: "#06b6d4",
      isEditable: false,
      easementType: "drainage",
      easementWidth: drainageWidth,
      easementHolder: "County Stormwater",
      restrictions: "No structures or fill",
    });
  }

  // Environmental - wetlands (uncommon, ~15% of properties)
  const hasWetlands = rand(70) > 0.85;
  if (hasWetlands) {
    const wetlandX = lotWidth - 20 - Math.floor(rand(71) * 30);
    const wetlandY = lotDepth - 30 - Math.floor(rand(72) * 40);
    existingFeatures.push({
      id: `wetland-${baseSeed}`,
      type: "wetland",
      label: "Wetland Buffer",
      x: Math.max(sideSetback, wetlandX),
      y: Math.max(frontSetback, wetlandY),
      width: 25 + Math.floor(rand(73) * 20),
      height: 35 + Math.floor(rand(74) * 25),
      setbackRequired: 50,
      color: "#14b8a6",
      isEditable: false,
    });
  }
  
  // Determine gas availability based on property characteristics
  const hasGasService = rand(75) > 0.3;
  
  return {
    existingFeatures,
    easements,
    sewerAvailable: !hasSeptic,
    sewerDistanceFeet: hasSeptic ? undefined : 15,
    waterAvailable: true,
    waterDistanceFeet: 20,
    gasAvailable: hasGasService,
    electricAvailable: true,
    onSiteWell: hasWell,
    wellLocation: hasWell ? { x: sideSetback + 10, y: frontSetback + 20 } : undefined,
    neighborWellNearby: rand(80) > 0.6,
    neighborWellDistance: rand(81) > 0.6 ? Math.floor(50 + rand(82) * 100) : undefined,
    wetlandsPresent: hasWetlands,
    floodZone: rand(83) > 0.9 ? "AE" : null,
    slopePercent: Math.floor(rand(84) * 15),
    soilType: rand(85) < 0.3 ? "Sandy loam" : rand(86) < 0.7 ? "Clay loam" : "Silty clay",
    septicSuitability: rand(87) < 0.3 ? "well_suited" : rand(88) < 0.7 ? "somewhat_limited" : "very_limited",
    hasDriveway,
    drivewayType: hasDriveway ? drivewayType : undefined,
    drivewayWidth: hasDriveway ? drivewayWidth : undefined,
  };
}

// ============================================
// REAL-TIME CONSTRAINT EVALUATION
// ============================================

export function evaluateConstraints(
  structure: PlacedStructure,
  allStructures: PlacedStructure[],
  constraints: SiteConstraints,
  lotWidth: number,
  lotDepth: number
): RealTimeComment[] {
  const comments: RealTimeComment[] = [];
  const structureRight = structure.x + structure.width;
  const structureBottom = structure.y + structure.depth;
  
  // ============================================
  // SETBACK CHECKS
  // ============================================
  
  const setbacks = {
    front: 25,
    side: structure.type === "house" ? 10 : 5,
    rear: 20,
  };
  
  // Front setback
  if (structure.y < setbacks.front) {
    const violation = setbacks.front - structure.y;
    comments.push({
      id: `setback-front-${structure.id}`,
      category: "setback",
      severity: "critical",
      title: "Front Setback Violation",
      message: `${structure.label} is ${violation.toFixed(0)}' into the ${setbacks.front}' front setback zone.`,
      citation: "Zoning Code §23.44.012",
      action: `Move structure at least ${violation.toFixed(0)}' back from the street.`,
      structureId: structure.id,
    });
  } else if (structure.y < setbacks.front + 5) {
    comments.push({
      id: `setback-front-close-${structure.id}`,
      category: "setback",
      severity: "warning",
      title: "Close to Front Setback",
      message: `${structure.label} is only ${(structure.y - setbacks.front).toFixed(0)}' from the setback line. Consider additional buffer.`,
      structureId: structure.id,
    });
  }
  
  // Side setbacks
  if (structure.x < setbacks.side) {
    comments.push({
      id: `setback-left-${structure.id}`,
      category: "setback",
      severity: "critical",
      title: "Left Side Setback Violation",
      message: `${structure.label} is ${(setbacks.side - structure.x).toFixed(0)}' into the side setback.`,
      citation: "Zoning Code §23.44.012(B)",
      action: "Move structure away from property line.",
      structureId: structure.id,
    });
  }
  
  if (structureRight > lotWidth - setbacks.side) {
    comments.push({
      id: `setback-right-${structure.id}`,
      category: "setback",
      severity: "critical",
      title: "Right Side Setback Violation",
      message: `${structure.label} extends into the right side setback.`,
      citation: "Zoning Code §23.44.012(B)",
      action: "Reduce width or move structure left.",
      structureId: structure.id,
    });
  }
  
  // Rear setback
  if (structureBottom > lotDepth - setbacks.rear) {
    comments.push({
      id: `setback-rear-${structure.id}`,
      category: "setback",
      severity: "critical",
      title: "Rear Setback Violation",
      message: `${structure.label} extends into the ${setbacks.rear}' rear setback.`,
      citation: "Zoning Code §23.44.012(C)",
      action: "Move structure forward or reduce depth.",
      structureId: structure.id,
    });
  }
  
  // ============================================
  // SEPTIC SYSTEM CHECKS
  // ============================================
  
  for (const feature of constraints.existingFeatures) {
    if (feature.type === "septic_tank" || feature.type === "drainfield" || feature.type === "reserve_area") {
      const featureRight = feature.x + feature.width;
      const featureBottom = feature.y + feature.height;
      const requiredDistance = feature.type === "drainfield" ? 20 : 10;
      
      // Check overlap
      const overlapsX = structure.x < featureRight + requiredDistance && structureRight > feature.x - requiredDistance;
      const overlapsY = structure.y < featureBottom + requiredDistance && structureBottom > feature.y - requiredDistance;
      
      if (overlapsX && overlapsY) {
        // Calculate actual distance
        const distX = Math.max(feature.x - structureRight, structure.x - featureRight, 0);
        const distY = Math.max(feature.y - structureBottom, structure.y - featureBottom, 0);
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance < requiredDistance) {
          const severity = feature.type === "drainfield" ? "critical" : "warning";
          comments.push({
            id: `septic-${feature.id}-${structure.id}`,
            category: "septic",
            severity,
            title: `Too Close to ${feature.label}`,
            message: feature.type === "drainfield" 
              ? `${structure.label} is only ${distance.toFixed(0)}' from the drainfield. Minimum ${requiredDistance}' required to protect system.`
              : `${structure.label} is within ${requiredDistance}' of ${feature.label}. This may damage the septic system.`,
            citation: "WAC 246-272A-0210",
            action: feature.type === "drainfield" 
              ? "Building over or near drainfield will damage the system. Heavy equipment can crush pipes."
              : "Maintain separation to allow future maintenance access.",
            structureId: structure.id,
          });
        }
      }
    }
  }
  
  // New structure needs septic - check if there's room
  if (!constraints.sewerAvailable && structure.type === "adu") {
    const hasExistingSeptic = constraints.existingFeatures.some(f => f.type === "drainfield");
    if (hasExistingSeptic) {
      comments.push({
        id: `septic-capacity-${structure.id}`,
        category: "septic",
        severity: "warning",
        title: "Septic Capacity Review Required",
        message: "Adding an ADU increases wastewater flow. Existing septic system capacity must be verified.",
        citation: "WAC 246-272A-0120",
        action: "Contact septic designer to evaluate if existing system can handle additional bedrooms.",
        structureId: structure.id,
      });
    }
  }
  
  // ============================================
  // WELL SETBACK CHECKS
  // ============================================
  
  if (constraints.onSiteWell && constraints.wellLocation) {
    const wellX = constraints.wellLocation.x;
    const wellY = constraints.wellLocation.y;
    
    // Distance from structure to well
    const distToWell = Math.sqrt(
      Math.pow(Math.max(structure.x - wellX, wellX - structureRight, 0), 2) +
      Math.pow(Math.max(structure.y - wellY, wellY - structureBottom, 0), 2)
    );
    
    // Building setback from well (typically 10')
    if (distToWell < 10) {
      comments.push({
        id: `well-building-${structure.id}`,
        category: "well",
        severity: "critical",
        title: "Well Setback Violation",
        message: `${structure.label} is only ${distToWell.toFixed(0)}' from the well. Minimum 10' required.`,
        citation: "Local Health Code",
        action: "Move structure away from well location.",
        structureId: structure.id,
      });
    }
    
    // If placing septic-related structure near well
    if (structure.type === "adu" || structure.type === "house") {
      const newSepticDistance = distToWell; // Simplified - actual would calculate to drainfield
      if (newSepticDistance < 100) {
        comments.push({
          id: `well-septic-${structure.id}`,
          category: "well",
          severity: "warning",
          title: "Well Protection Zone",
          message: `Any new septic components must be 100'+ from well. Current structure placement may limit septic options.`,
          citation: "WAC 246-272A-0210",
          structureId: structure.id,
        });
      }
    }
  }
  
  // Neighbor well warning
  if (constraints.neighborWellNearby && constraints.neighborWellDistance) {
    if (constraints.neighborWellDistance < 100) {
      comments.push({
        id: `neighbor-well-${structure.id}`,
        category: "well",
        severity: "info",
        title: "Neighboring Well Nearby",
        message: `A well is located approximately ${constraints.neighborWellDistance}' away on neighboring property. Septic placement is restricted.`,
        citation: "WAC 246-272A-0210",
      });
    }
  }
  
  // ============================================
  // UTILITY INFRASTRUCTURE CHECKS
  // ============================================
  
  // Check distance to sewer line (for connection planning)
  if (constraints.sewerAvailable && (structure.type === "adu" || structure.type === "house")) {
    comments.push({
      id: `sewer-connection-${structure.id}`,
      category: "utility",
      severity: "info",
      title: "Sewer Connection Available",
      message: `Municipal sewer is ${constraints.sewerDistanceFeet || 15}' from property line. New dwelling must connect.`,
      citation: "Municipal Code §13.04",
      action: "Include sewer lateral in building plans. Side sewer permit required.",
    });
  }
  
  // Water connection
  if (structure.type === "adu" || structure.type === "house") {
    comments.push({
      id: `water-connection-${structure.id}`,
      category: "utility",
      severity: "info",
      title: "Water Service",
      message: constraints.onSiteWell 
        ? "Property uses private well. Water quality/flow test recommended for ADU."
        : `Municipal water available ${constraints.waterDistanceFeet || 20}' from property.`,
    });
  }
  
  // Gas availability
  if (constraints.gasAvailable && (structure.type === "adu" || structure.type === "house")) {
    comments.push({
      id: `gas-available-${structure.id}`,
      category: "utility",
      severity: "success",
      title: "Natural Gas Available",
      message: "Natural gas service is available at street. Gas line extension to new structure possible.",
    });
  } else if (!constraints.gasAvailable && (structure.type === "adu" || structure.type === "house")) {
    comments.push({
      id: `no-gas-${structure.id}`,
      category: "utility",
      severity: "info",
      title: "No Natural Gas",
      message: "Natural gas not available. Plan for electric or propane heating/cooking.",
    });
  }
  
  // ============================================
  // ENVIRONMENTAL CHECKS
  // ============================================
  
  for (const feature of constraints.existingFeatures) {
    if (feature.type === "wetland") {
      const featureRight = feature.x + feature.width;
      const featureBottom = feature.y + feature.height;
      const bufferRequired = feature.setbackRequired || 50;
      
      const distX = Math.max(feature.x - structureRight, structure.x - featureRight, 0);
      const distY = Math.max(feature.y - structureBottom, structure.y - featureBottom, 0);
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance < bufferRequired) {
        comments.push({
          id: `wetland-${structure.id}`,
          category: "environmental",
          severity: "critical",
          title: "Wetland Buffer Violation",
          message: `${structure.label} is within ${bufferRequired}' wetland buffer zone. No construction allowed.`,
          citation: "Critical Areas Ordinance",
          action: "Move structure outside buffer zone. Wetland delineation may be required.",
          structureId: structure.id,
        });
      }
    }
  }
  
  // Flood zone
  if (constraints.floodZone) {
    comments.push({
      id: `flood-zone-${structure.id}`,
      category: "environmental",
      severity: "warning",
      title: "Flood Zone Property",
      message: `Property is in FEMA Zone ${constraints.floodZone}. Special requirements apply.`,
      citation: "FEMA Flood Map",
      action: "Elevation certificate required. Must build above Base Flood Elevation.",
      structureId: structure.id,
    });
  }
  
  // Steep slopes
  if (constraints.slopePercent > 15) {
    comments.push({
      id: `slope-${structure.id}`,
      category: "environmental",
      severity: constraints.slopePercent > 30 ? "warning" : "info",
      title: constraints.slopePercent > 30 ? "Steep Slope Concerns" : "Moderate Slope",
      message: `Site has ${constraints.slopePercent}% slopes. ${constraints.slopePercent > 30 ? "Geotechnical study may be required." : "Consider grading in foundation design."}`,
    });
  }
  
  // ============================================
  // STRUCTURE-TO-STRUCTURE CHECKS
  // ============================================
  
  for (const other of allStructures) {
    if (other.id === structure.id) continue;
    
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.depth;
    const minSeparation = 6;
    
    // Check overlap
    const overlapsX = structure.x < otherRight && structureRight > other.x;
    const overlapsY = structure.y < otherBottom && structureBottom > other.y;
    
    if (overlapsX && overlapsY) {
      comments.push({
        id: `overlap-${structure.id}-${other.id}`,
        category: "structure",
        severity: "critical",
        title: "Structure Overlap",
        message: `${structure.label} overlaps with ${other.label}. Structures must be separated.`,
        citation: "Building Code",
        action: `Maintain at least ${minSeparation}' separation between structures.`,
        structureId: structure.id,
      });
    } else {
      // Check separation distance
      const distX = Math.max(other.x - structureRight, structure.x - otherRight, 0);
      const distY = Math.max(other.y - structureBottom, structure.y - otherBottom, 0);
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance < minSeparation && distance > 0) {
        comments.push({
          id: `separation-${structure.id}-${other.id}`,
          category: "structure",
          severity: "warning",
          title: "Insufficient Separation",
          message: `Only ${distance.toFixed(0)}' between ${structure.label} and ${other.label}. ${minSeparation}' required.`,
          citation: "Fire Code §503.1",
          structureId: structure.id,
        });
      }
    }
  }
  
  // Check against existing features (houses, garages)
  for (const feature of constraints.existingFeatures) {
    if (feature.type === "house" || feature.type === "garage" || feature.type === "shed") {
      const featureRight = feature.x + feature.width;
      const featureBottom = feature.y + feature.height;
      const minSep = feature.setbackRequired || 6;
      
      const overlapsX = structure.x < featureRight + minSep && structureRight > feature.x - minSep;
      const overlapsY = structure.y < featureBottom + minSep && structureBottom > feature.y - minSep;
      
      if (overlapsX && overlapsY) {
        const distX = Math.max(feature.x - structureRight, structure.x - featureRight, 0);
        const distY = Math.max(feature.y - structureBottom, structure.y - featureBottom, 0);
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance < minSep) {
          comments.push({
            id: `existing-${feature.id}-${structure.id}`,
            category: "structure",
            severity: distance === 0 ? "critical" : "warning",
            title: `Close to ${feature.label}`,
            message: distance === 0 
              ? `${structure.label} overlaps with existing ${feature.label}.`
              : `${structure.label} is only ${distance.toFixed(0)}' from ${feature.label}. ${minSep}' required.`,
            citation: "Building Code",
            structureId: structure.id,
          });
        }
      }
    }
  }
  
  // ============================================
  // LOT COVERAGE CHECK
  // ============================================
  
  const totalCoverage = allStructures.reduce((sum, s) => sum + s.width * s.depth, 0);
  const existingCoverage = constraints.existingFeatures
    .filter(f => f.type === "house" || f.type === "garage" || f.type === "shed")
    .reduce((sum, f) => sum + f.width * f.height, 0);
  
  const totalWithExisting = totalCoverage + existingCoverage;
  const lotArea = lotWidth * lotDepth;
  const coveragePercent = (totalWithExisting / lotArea) * 100;
  const maxCoverage = 35;
  
  if (coveragePercent > maxCoverage) {
    comments.push({
      id: `coverage-exceeded`,
      category: "coverage",
      severity: "critical",
      title: "Lot Coverage Exceeded",
      message: `Total lot coverage is ${coveragePercent.toFixed(1)}%. Maximum ${maxCoverage}% allowed.`,
      citation: "Zoning Code §23.44.022",
      action: `Reduce structure footprints by ${((coveragePercent - maxCoverage) / 100 * lotArea).toFixed(0)} sqft.`,
    });
  } else if (coveragePercent > maxCoverage - 5) {
    comments.push({
      id: `coverage-close`,
      category: "coverage",
      severity: "warning",
      title: "Approaching Coverage Limit",
      message: `Current coverage ${coveragePercent.toFixed(1)}% is close to ${maxCoverage}% maximum.`,
    });
  }
  
  // ============================================
  // PERMIT REQUIREMENTS
  // ============================================
  
  if (structure.type === "adu" || structure.type === "dadu") {
    comments.push({
      id: `permit-adu-${structure.id}`,
      category: "permit",
      severity: "info",
      title: "ADU Permits Required",
      message: "ADU requires: Building Permit, possibly Electrical, Plumbing, Mechanical permits.",
      action: "Pre-application meeting with planning department recommended.",
    });
    
    if (!constraints.sewerAvailable) {
      comments.push({
        id: `permit-septic-${structure.id}`,
        category: "permit",
        severity: "info",
        title: "Septic Permit Required",
        message: "On-site sewage permit required from Health Department for ADU.",
        action: "Schedule site evaluation with licensed septic designer.",
      });
    }
  }
  
  if (structure.type === "pool") {
    comments.push({
      id: `permit-pool-${structure.id}`,
      category: "permit",
      severity: "info",
      title: "Pool Permits",
      message: "Swimming pool requires: Building permit, Electrical permit, Fence/barrier inspection.",
      citation: "Building Code §3109",
    });
  }
  
  // ============================================
  // SUCCESS MESSAGE
  // ============================================
  
  const criticalCount = comments.filter(c => c.severity === "critical").length;
  const warningCount = comments.filter(c => c.severity === "warning").length;
  
  if (criticalCount === 0 && warningCount === 0) {
    comments.push({
      id: `placement-ok-${structure.id}`,
      category: "setback",
      severity: "success",
      title: "Placement Compliant",
      message: `${structure.label} placement meets setback and separation requirements.`,
      structureId: structure.id,
    });
  }
  
  return comments;
}

// ============================================
// GET PERMIT REQUIREMENTS
// ============================================

export function getPermitRequirements(
  structures: PlacedStructure[],
  constraints: SiteConstraints
): PermitRequirement[] {
  const permits: PermitRequirement[] = [];
  
  const hasNewDwelling = structures.some(s => s.type === "house" || s.type === "adu" || s.type === "dadu");
  const hasPool = structures.some(s => s.type === "pool");
  const hasGarage = structures.some(s => s.type === "garage");
  const hasShop = structures.some(s => s.type === "shop");
  
  // Building permit (always for structures over 200 sqft)
  const needsBuildingPermit = structures.some(s => s.width * s.depth > 200);
  if (needsBuildingPermit) {
    permits.push({
      permitType: "Building Permit",
      authority: "Building Department",
      estimatedFee: "$1,500 - $5,000",
      timeline: "4-8 weeks review",
      required: true,
      triggeredBy: "Structures over 200 sqft",
    });
  }
  
  // On-site sewage permit
  if (!constraints.sewerAvailable && hasNewDwelling) {
    permits.push({
      permitType: "On-Site Sewage System",
      authority: "Health Department",
      estimatedFee: "$800 - $1,500",
      timeline: "2-4 weeks after site evaluation",
      required: true,
      triggeredBy: "New dwelling without sewer",
    });
  }
  
  // Sewer connection permit
  if (constraints.sewerAvailable && hasNewDwelling) {
    permits.push({
      permitType: "Sewer Connection",
      authority: "Public Works / Utility",
      estimatedFee: "$500 - $2,000",
      timeline: "1-2 weeks",
      required: true,
      triggeredBy: "New dwelling in sewer service area",
    });
  }
  
  // Electrical permit
  if (hasNewDwelling || hasPool || hasShop) {
    permits.push({
      permitType: "Electrical Permit",
      authority: "Building Department",
      estimatedFee: "$200 - $500",
      timeline: "Concurrent with building",
      required: true,
      triggeredBy: "New electrical service",
    });
  }
  
  // Plumbing permit
  if (hasNewDwelling) {
    permits.push({
      permitType: "Plumbing Permit",
      authority: "Building Department",
      estimatedFee: "$200 - $400",
      timeline: "Concurrent with building",
      required: true,
      triggeredBy: "New plumbing fixtures",
    });
  }
  
  // Mechanical permit
  if (hasNewDwelling) {
    permits.push({
      permitType: "Mechanical Permit",
      authority: "Building Department",
      estimatedFee: "$150 - $300",
      timeline: "Concurrent with building",
      required: true,
      triggeredBy: "HVAC installation",
    });
  }
  
  // Grading permit (if significant earthwork)
  if (constraints.slopePercent > 15 || hasPool) {
    permits.push({
      permitType: "Grading Permit",
      authority: "Building/Public Works",
      estimatedFee: "$300 - $800",
      timeline: "2-4 weeks",
      required: constraints.slopePercent > 25,
      triggeredBy: constraints.slopePercent > 15 ? "Steep slopes" : "Pool excavation",
    });
  }
  
  // Environmental review
  if (constraints.wetlandsPresent || constraints.floodZone) {
    permits.push({
      permitType: "Critical Areas Review",
      authority: "Planning Department",
      estimatedFee: "$500 - $2,000",
      timeline: "4-8 weeks",
      required: true,
      triggeredBy: constraints.wetlandsPresent ? "Wetlands on property" : "Flood zone location",
    });
  }
  
  return permits;
}

// ============================================
// UTILITY SUMMARY
// ============================================

export function getUtilitySummary(constraints: SiteConstraints): string[] {
  const summary: string[] = [];
  
  if (constraints.sewerAvailable) {
    summary.push(`✓ Sewer: Available (${constraints.sewerDistanceFeet || 15}' to main)`);
  } else {
    summary.push(`⚠ Sewer: Not available (septic required)`);
  }
  
  if (constraints.waterAvailable) {
    if (constraints.onSiteWell) {
      summary.push(`✓ Water: Private well on-site`);
    } else {
      summary.push(`✓ Water: Municipal (${constraints.waterDistanceFeet || 20}' to main)`);
    }
  }
  
  if (constraints.gasAvailable) {
    summary.push(`✓ Gas: Natural gas available`);
  } else {
    summary.push(`— Gas: Not available (electric/propane)`);
  }
  
  if (constraints.electricAvailable) {
    summary.push(`✓ Electric: Available`);
  }
  
  return summary;
}

// ============================================
// SEPTIC SUMMARY
// ============================================

export function getSepticSummary(constraints: SiteConstraints): { 
  status: "ok" | "review" | "challenging"; 
  messages: string[];
} {
  if (constraints.sewerAvailable) {
    return { 
      status: "ok", 
      messages: ["Sewer connection required. No septic needed."] 
    };
  }
  
  const messages: string[] = [];
  let status: "ok" | "review" | "challenging" = "ok";
  
  // Check existing septic
  const hasSeptic = constraints.existingFeatures.some(f => f.type === "drainfield");
  if (hasSeptic) {
    messages.push("Existing septic system on property");
    messages.push("System capacity must be verified for additional dwellings");
  }
  
  // Soil suitability
  switch (constraints.septicSuitability) {
    case "well_suited":
      messages.push(`Soil: ${constraints.soilType} — Well suited for conventional septic`);
      break;
    case "somewhat_limited":
      messages.push(`Soil: ${constraints.soilType} — Some limitations, may need enhanced system`);
      status = "review";
      break;
    case "very_limited":
      messages.push(`Soil: ${constraints.soilType} — Significant limitations, alternative system likely required`);
      status = "challenging";
      break;
  }
  
  // Well considerations
  if (constraints.onSiteWell) {
    messages.push("On-site well requires 100' separation from new drainfield");
  }
  if (constraints.neighborWellNearby && constraints.neighborWellDistance) {
    messages.push(`Neighboring well ~${constraints.neighborWellDistance}' away affects septic placement`);
    if (constraints.neighborWellDistance < 100) {
      status = "challenging";
    }
  }
  
  return { status, messages };
}

