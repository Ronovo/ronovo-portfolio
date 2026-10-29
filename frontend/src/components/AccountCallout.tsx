import type { Site } from "../types";

export default function AccountCallout({ site }: { site: Site }) {
  return (
    <div className="card callout">
      <div>
        <h2>One account for everything</h2>
        <p>A portfolio account logs you in to every app here, from the casino to GM Toolbox.</p>
      </div>
      {site.account ? (
        <p>
          Logged in as <a href="/account">{site.account}</a>
        </p>
      ) : (
        <div className="cta">
          <a className="btn" href="/account/register">
            Create an account
          </a>
          <a className="btn btn-ghost" href="/account/login">
            Log in
          </a>
        </div>
      )}
    </div>
  );
}
