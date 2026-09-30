import type { Metadata, Viewport } from "next";
import { ebGaramond, interTight } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saifeddine Ounissi — Network & Cybersecurity Technician",
  description:
    "Saifeddine Ounissi — network and cybersecurity technician from Médenine, Tunisia. ISET de Gabès network security graduate (2026) with hands-on SOC experience on Wazuh and Suricata, Blue Team automation in Python, and virtualised infrastructure on VMware and Docker.",
  keywords: [
    "Saifeddine Ounissi",
    "network security",
    "cybersecurity technician",
    "SOC",
    "SIEM",
    "Wazuh",
    "Suricata",
    "Nmap",
    "Blue Team",
    "pfSense",
    "VyOS",
    "Docker",
    "FastAPI",
    "Python",
    "ISET Gabès",
  ],
  openGraph: {
    title: "Saifeddine Ounissi — Network & Cybersecurity Technician",
    description:
      "Network and cybersecurity technician. SOC operations on Wazuh and Suricata, Blue Team automation in Python, and virtualised infrastructure on VMware and Docker.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030509",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${ebGaramond.variable} ${interTight.variable}`}>
      <body className="grain vignette font-body antialiased">{children}</body>
    </html>
  );
}
