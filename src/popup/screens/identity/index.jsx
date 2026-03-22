import { useState } from "preact/hooks";
import { IdentityHomeScreen } from "./IdentityHome.jsx";
import { EditProfileScreen } from "./EditProfile.jsx";
import { RegisterNameScreen } from "./RegisterName.jsx";
import { CredentialDetailScreen } from "./CredentialDetail.jsx";

/**
 * Identity screen router — manages its own navigation stack.
 * Entry from More → "Identity".
 */
export function IdentityRouter({ address, onBack }) {
  const [stack, setStack] = useState([{ screen: "home" }]);
  const current = stack[stack.length - 1];

  const push = (screen, props = {}) => setStack([...stack, { screen, ...props }]);
  const pop = () => {
    if (stack.length <= 1) { onBack(); return; }
    setStack(stack.slice(0, -1));
  };

  switch (current.screen) {
    case "home":
      return (
        <IdentityHomeScreen
          address={address}
          onBack={onBack}
          onEditProfile={(name) => push("edit-profile", { name })}
          onRegisterName={() => push("register-name")}
          onCredentialDetail={(cred) => push("credential", { credential: cred })}
          onRequestProof={() => { /* TODO: selective proof flow */ }}
        />
      );

    case "edit-profile":
      return <EditProfileScreen name={current.name} onBack={pop} />;

    case "register-name":
      return (
        <RegisterNameScreen
          onBack={pop}
          onRegistered={(name) => {
            // Pop register, push edit profile for the new name
            const newStack = stack.slice(0, -1);
            setStack([...newStack, { screen: "edit-profile", name }]);
          }}
        />
      );

    case "credential":
      return <CredentialDetailScreen credential={current.credential} onBack={pop} />;

    default:
      return null;
  }
}
