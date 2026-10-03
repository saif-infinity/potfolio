/**
 * Single source of truth for every piece of copy on the site.
 * Edit this file to change content — no component edits required.
 */

import type { IconName } from "@/components/icons";
import { safeHref } from "@/lib/safeHref";

/**
 * `year` is OPTIONAL on purpose. The owner's CV dates only the CTF (2025); it
 * gives no year at all for CCNA 1, AWS Cloud Foundations or Introduction to
 * Cybersecurity. Rather than print an unsourced 2025 on a parchment that reads
 * as a document of record, those three carry no date at all — the parchment
 * omits its date line and the UI omits the year. Add a `year` only once the
 * owner has actually confirmed one.
 */
export type Certificate = {
  /** URL-safe identifier, also the ?slug= deep-link value */
  slug: string;
  /** Short title — this is the large line rendered on the certificate face */
  title: string;
  /** Complete official title, used as the secondary line */
  fullTitle: string;
  /** Awarding body */
  issuer: string;
  year?: string;
  /** 3-4 very short skill chips, max 2-3 words each */
  focus: string[];
  /** One or two sentences, rendered as the certificate's meta line */
  blurb: string;
  icon: IconName;
};

/**
 * Derived from `awards` — the four credentials listed there, restructured for
 * the certificate artwork. Do not add dates, credential IDs, grades, or
 * issuing details that are not already recorded on the site; the certificate
 * face is a document of record and invented particulars are a liability.
 */
export const certificates: Certificate[] = [
  {
    slug: "ccna-1",
    title: "CCNA 1",
    fullTitle: "Cisco CCNA 1 — Introduction to Networks",
    issuer: "Cisco",
    focus: ["IP & Subnetting", "Switching", "Routing", "Device Configuration"],
    blurb:
      "Course completed — foundational networking covering IP, switching, routing and device configuration.",
    icon: "globe",
  },
  {
    slug: "aws-cloud-foundations",
    title: "Cloud Foundations",
    fullTitle: "AWS Cloud Foundations",
    issuer: "Amazon Web Services",
    focus: ["Cloud Architecture", "Core Services", "Delivery Fundamentals"],
    blurb:
      "Introductory coverage — core AWS architecture, services and delivery fundamentals.",
    icon: "layers",
  },
  {
    slug: "intro-cybersecurity",
    title: "Introduction to Cybersecurity",
    fullTitle: "Cisco Introduction to Cybersecurity",
    issuer: "Cisco",
    focus: ["Threat Landscape", "Defensive Controls", "Network Security Basics"],
    blurb:
      "Course completed — threat landscape, defensive controls and network security fundamentals.",
    icon: "cpu",
  },
  {
    slug: "ctf-blue-team",
    title: "CTF — Blue Team",
    fullTitle: "Cisco Networking Academy Capture the Flag — Blue Team",
    issuer: "Cisco Networking Academy",
    year: "2025",
    focus: ["Defending Under Attack", "Log Analysis", "Incident Response"],
    blurb:
      "Competed in the Blue Team capture-the-flag, defending an environment under attack.",
    icon: "trophy",
  },
];

/**
 * A qualification from `education`. `subjects` renders as chips; `note` is a
 * single line for the outcome (graduation date, mention) that does not belong
 * in the period.
 */
export type EducationEntry = {
  qualification: string;
  org: string;
  speciality?: string;
  period: string;
  note?: string;
  subjects: string[];
};

export const site = {
  name: "Saifeddine Ounissi",
  shortName: "SAIFEDDINE OUNISSI",
  role: "NETWORK & CYBERSECURITY TECHNICIAN",
  eyebrow: "ISET GABÈS · NETWORK SECURITY · 2026 GRADUATE",
  title: "A SOC & Network Engineer",
  description:
    "I build and defend networks — hands-on experience running a SOC on Wazuh and Suricata, virtualising infrastructure with VMware and VyOS, and automating Blue Team workflows in Python. ISET de Gabès network security graduate, based in Médenine, Tunisia.",

  stats: [
    { value: "2", label: "TELECOM INTERNSHIPS" },
    { value: "1", label: "SOC PLATFORM BUILT" },
    { value: "3", label: "NETWORK COURSES" },
  ],

  nav: [
    { label: "SERVICES", href: "#services" },
    { label: "PROJECTS", href: "#projects" },
    { label: "TRAINING", href: "#awards" },
    { label: "SKILLS", href: "#skills" },
    { label: "EDUCATION", href: "#education" },
    { label: "EXPERIENCE", href: "#experience" },
    { label: "CONTACT", href: "#contact" },
  ],

  services: [
    {
      icon: "terminal" as IconName,
      title: "SOC & BLUE TEAM",
      blurb:
        "SIEM and IDS stacks on Wazuh and Suricata — multisource log collection, detection, real-time alerting, dashboards and incident response.",
    },
    {
      icon: "cpu" as IconName,
      title: "NETWORK SECURITY",
      blurb:
        "TCP/IP, OSI, IPv4/IPv6, VLAN, routing and switching, hardened with pfSense and VyOS firewalls across lab and virtual environments.",
    },
    {
      icon: "layers" as IconName,
      title: "DEVOPS & VIRTUALISATION",
      blurb:
        "VMware and Docker Compose infrastructure, orchestrated services, Linux and Windows Server administration with Git-based workflows.",
    },
    {
      icon: "code" as IconName,
      title: "PYTHON AUTOMATION",
      blurb:
        "Python and Bash tooling for packet analysis, port scanning and Blue Team automation, exposed through FastAPI and React interfaces.",
    },
    {
      icon: "sparkles" as IconName,
      title: "CLOUD & TRAINING",
      blurb:
        "AWS Cloud Foundations and the Cisco Networking Academy track — CCNA 1, Introduction to Cybersecurity, and a Blue Team CTF placement.",
    },
  ],

  projects: [
    {
      title: "Sentinel Bridge - SOC/IPS/SIEM/XDR Platform",
      blurb:
        "Unified multi-tenant SOC platform with FastAPI backend, dual React frontends (SOC + Admin), RBAC, face recognition, case management, playbook automation, threat intel enrichment, and MITRE ATT&CK mapping. TimescaleDB + Celery + Redis for scalable detection & response.",
      tags: ["FastAPI", "React", "TypeScript", "PostgreSQL", "TimescaleDB", "Celery", "Redis", "Docker", "Wazuh", "Suricata"],
      icon: "terminal" as IconName,
      link: "https://github.com/saif-infinity/projet-soc-ips-siem-xdr-",
    },
    {
      title: "Port Sniffer & Packet Analyser",
      blurb:
        "A Python sniffer built on Socket and Scapy that captures and analyses live traffic, with port-scanning and local-audit features inspired by Nmap.",
      tags: ["Python", "Scapy", "Socket", "Nmap"],
      icon: "cpu" as IconName,
    },
    {
      title: "Network Scan Web Interface",
      blurb:
        "Wrapped Nmap in a web interface to scan a local network and surface the potential vulnerabilities it reports.",
      tags: ["Nmap", "Network Scanning", "Web Interface"],
      icon: "globe" as IconName,
    },
    {
      title: "Camera-Cursor Control",
      blurb:
        "A Python and OpenCV interface that moves the on-screen cursor from finger position detected through the webcam — no mouse, no touchpad.",
      tags: ["Python", "OpenCV", "Computer Vision"],
      icon: "camera" as IconName,
    },
  ],

  awards: [
    {
      title: "Cisco CCNA 1 — Introduction to Networks",
      blurb:
        "Course completed — foundational networking covering IP, switching, routing and device configuration.",
      icon: "globe" as IconName,
    },
    {
      title: "AWS Cloud Foundations",
      blurb:
        "Introductory coverage — core AWS architecture, services and delivery fundamentals.",
      icon: "layers" as IconName,
    },
    {
      title: "Cisco Introduction to Cybersecurity",
      blurb:
        "Course completed — threat landscape, defensive controls and network security fundamentals.",
      icon: "cpu" as IconName,
    },
    {
      title: "Cisco Networking Academy CTF — Blue Team",
      blurb: "Competed in the Blue Team capture-the-flag, defending an environment under attack.",
      year: "2025",
      icon: "trophy" as IconName,
    },
  ],

  certificates,

  skills: [
    {
      group: "Security & SOC",
      icon: "terminal" as IconName,
      items: [
        "Wazuh",
        "Suricata",
        "Vector",
        "Wireshark",
        "Nmap",
        "pfSense",
        "VyOS",
      ],
    },
    {
      group: "Networking",
      icon: "globe" as IconName,
      items: [
        "TCP/IP",
        "OSI",
        "IPv4/IPv6",
        "VLAN",
        "Routing",
        "Switching",
        "VPN",
        "Firewalls",
        "Wi-Fi",
        "GNS3",
        "Packet Tracer",
      ],
    },
    {
      group: "Systems & DevOps",
      icon: "layers" as IconName,
      items: [
        "Linux",
        "Windows Server",
        "VMware",
        "Docker",
        "Docker Compose",
        "Git",
        "Apache",
        "PostgreSQL",
      ],
    },
    {
      group: "Development",
      icon: "code" as IconName,
      items: [
        "Python",
        "Bash",
        "Java",
        "Kotlin",
        "FastAPI",
        "React",
        "Vite",
        "HTML5",
        "CSS3",
      ],
    },
    {
      group: "Cloud & Security Basics",
      icon: "sparkles" as IconName,
      items: [
        "AWS Cloud Foundations",
        "CCNA 1",
        "Cryptography",
      ],
    },
  ],

  experience: [
    {
      role: "Final-Year Project Intern",
      org: "Pioneer Tech Cyberpark",
      period: "Feb 2026 — May 2026 · 4 months",
      points: [
        "Designed and deployed Sentinel SOC, a customisable SOC platform built from open components: Wazuh, Suricata, Vector, PostgreSQL, FastAPI, React and Vite.",
        "Virtualised the infrastructure under VMware with a VyOS router and a pfSense firewall, orchestrating the services with Docker.",
        "Set up the Blue Team cycle end to end: multisource log collection, detection, real-time alerting, dashboards and incident response.",
      ],
    },
    {
      role: "Maintenance Intern",
      org: "Tunisie Télécom — Radio Unit, Médenine",
      period: "Summer 2025 · 1 month",
      points: [
        "Carried out preventive and corrective maintenance on radio transmission equipment.",
        "Monitored network traffic and contributed to diagnosing connectivity outages.",
      ],
    },
    {
      role: "Initiation Intern",
      org: "Tunisie Télécom — Radio Unit, Médenine",
      period: "Summer 2024 · 1 month",
      points: [
        "Observed the operator's network architecture and assisted the team with routine maintenance activities.",
      ],
    },
  ],

  education: [
    {
      qualification: "Higher Technician Diploma in Information Technology",
      org: "ISET de Gabès",
      speciality: "Network Security",
      period: "2024 — 2026",
      note: "Graduated June 2026",
      subjects: [
        "System Administration",
        "Routing & Switching",
        "Cryptography",
        "Offensive & Defensive Security",
      ],
    },
    {
      qualification: "Baccalaureate, Technical Stream",
      org: "Lycée Ibn Majah, Médenine",
      period: "2023",
      note: "Mention Assez bien",
      subjects: [],
    },
  ],

  languages: [
    { label: "Arabic", level: "Native language", meter: 1 },
    { label: "French", level: "Intermediate · professional use", meter: 0.6 },
    { label: "English", level: "Technical · reading documentation", meter: 0.4 },
  ],

  socials: [
    {
      label: "LinkedIn",
      icon: "linkedin" as IconName,
      href: "https://linkedin.com/in/saif-eddine-ounissi",
    },
    { label: "Email", icon: "mail" as IconName, href: "mailto:saifounissi34@gmail.com" },
  ],

  contact: {
    email: "saifounissi34@gmail.com",
    phone: "+216 28 400 598",
    location: "Médenine, Tunisia",
    availability:
      "Open to junior SOC, network administration and cyber defence roles.",
  },
} as const;

/**
 * Social links that survived the outbound allowlist. A rejected entry is
 * dropped here so the hero and contact maps never render an anchor with an
 * empty or unsafe href.
 */
export const safeSocials = site.socials.filter((social) => safeHref(social.href) !== null);

/**
 * Composes a `mailto:` link and runs it through the outbound allowlist, so a
 * malformed or unexpected `site.contact.email` can never reach an anchor.
 * Returns `null` when the result is not a permitted destination — call sites
 * must handle that rather than substituting a dead `href="#"`.
 */
export const mailto = (subject = "Hello"): string | null =>
  safeHref(`mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}`);
