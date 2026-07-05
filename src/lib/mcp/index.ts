import { defineMcp } from "@lovable.dev/mcp-js";
import platformOverview from "./tools/platform-overview";
import wildlifeThreats from "./tools/wildlife-threats";
import healthTriage from "./tools/health-triage";
import emergencyFirstAid from "./tools/emergency-first-aid";

export default defineMcp({
  name: "anima-nexus-mcp",
  title: "ANIMA Nexus",
  version: "0.1.0",
  instructions:
    "Tools for ANIMA Nexus — the AI digital guardian for animals. Use `platform_overview` to route users to the right module, `get_wildlife_threats` for the live NASA EONET + USGS habitat threat feed, `animal_health_triage` for symptom triage, and `emergency_first_aid` for stabilization steps in an animal emergency. Always recommend a licensed veterinarian for anything serious.",
  tools: [platformOverview, wildlifeThreats, healthTriage, emergencyFirstAid],
});