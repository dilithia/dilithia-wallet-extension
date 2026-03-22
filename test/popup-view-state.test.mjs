import test from "node:test";
import assert from "node:assert/strict";
import { computePopupVisibility } from "../src/popup/view-state.mjs";

test("shows onboarding card on first run", () => {
  assert.deepEqual(
    computePopupVisibility({ hasWallet: false, view: "home" }),
    {
      showOnboardingCard: true,
      showPostWalletSections: false,
      showSettings: false,
    },
  );
});

test("shows post-wallet sections after wallet exists", () => {
  assert.deepEqual(
    computePopupVisibility({ hasWallet: true, view: "home" }),
    {
      showOnboardingCard: false,
      showPostWalletSections: true,
      showSettings: false,
    },
  );
});

test("settings view hides onboarding and wallet content", () => {
  assert.deepEqual(
    computePopupVisibility({ hasWallet: false, view: "settings" }),
    {
      showOnboardingCard: false,
      showPostWalletSections: false,
      showSettings: true,
    },
  );
});
