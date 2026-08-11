import LOGO from "@/assets/images/spriteIcon.png";

export function WelcomeHero() {
  return (
    <div className="aw-hero">
      <div className="aw-hero-logo" aria-hidden="true">
        <img src={LOGO} alt="" />
      </div>
      <p className="aw-welcome">Welcome to 精灵</p>
      <h1 className="aw-headline">How can I help?</h1>
    </div>
  );
}
