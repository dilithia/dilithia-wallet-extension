export function computePopupVisibility({ hasWallet, view }) {
  const inSettings = view === "settings";

  return {
    showOnboardingCard: !inSettings && !hasWallet,
    showPostWalletSections: !inSettings && hasWallet,
    showSettings: inSettings,
  };
}
