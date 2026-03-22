export function OnboardingScreen({ onCreateWallet, onImportWallet }) {
  return (
    <div class="screen-centered">
      <h1 class="text-hero">Get Started</h1>
      <div class="stack stack-md max-w-buttons" style={{ marginTop: 140 }}>
        <button class="btn btn-primary" onClick={onCreateWallet}>
          Create Wallet
        </button>
        <button class="btn btn-subtle" onClick={onImportWallet}>
          I already have a wallet
        </button>
      </div>
    </div>
  );
}
