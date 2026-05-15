export function Legend() {
  return (
    <div className="panel legend">
      Each starling watches its <b>k nearest neighbours</b> — not neighbours within a fixed
      radius. This <i>topological</i> rule is what real Roman starlings actually use{" "}
      <span className="cite">(Ballerini et al., PNAS 2008)</span>, and it's why flocks stay
      cohesive when they get sparse or dense. The order parameter <b>λ</b> is the
      magnitude of the average heading direction — 1.0 means perfectly aligned, ~0 means
      chaos. Move your cursor through the flock to play the falcon.
    </div>
  );
}
