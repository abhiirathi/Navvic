export type Tool = {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  description: string;
  icon: "ScanSearch" | "Calculator" | "Container" | "FileText";
  status: "live" | "soon";
};

export const tools: Tool[] = [
  {
    slug: "hs-code",
    href: "/tools/hs-code",
    name: "HS Code Classifier",
    tagline: "Plain English → HS codes",
    description:
      "Describe a product in everyday language and get matched Harmonized System codes at H2, H4, H6 and H8 levels.",
    icon: "ScanSearch",
    status: "live",
  },
  {
    slug: "duty",
    href: "/tools",
    name: "Duty & Landed-Cost Estimator",
    tagline: "Estimate import duties",
    description: "Calculate indicative duties, taxes and landed cost per unit across destination markets.",
    icon: "Calculator",
    status: "soon",
  },
  {
    slug: "container",
    href: "/tools",
    name: "Container Load Planner",
    tagline: "Optimise FCL & LCL",
    description: "Work out how many cases fit a 20ft/40ft container and the most efficient mix.",
    icon: "Container",
    status: "soon",
  },
  {
    slug: "docs",
    href: "/tools",
    name: "Export Doc Generator",
    tagline: "Invoices & packing lists",
    description: "Generate commercial invoices, packing lists and certificates of origin in seconds.",
    icon: "FileText",
    status: "soon",
  },
];
