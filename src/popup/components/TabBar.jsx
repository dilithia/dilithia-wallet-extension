const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12l9-8 9 8" />
    <path d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9" />
  </svg>
);

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const PrivacyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

const TABS = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "activity", label: "Activity", Icon: ActivityIcon },
  { id: "privacy", label: "Privacy", Icon: PrivacyIcon },
  { id: "more", label: "More", Icon: MoreIcon },
];

export function TabBar({ active, onSelect }) {
  return (
    <nav class="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          class={`tab-bar-item ${active === tab.id ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
        >
          <div class="tab-bar-icon"><tab.Icon /></div>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
