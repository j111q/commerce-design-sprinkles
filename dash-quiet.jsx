/* Direction A — "Quiet admin": WP design system structure, Woo violet as the accent. */

function QAvatar({ id, size = 24, title }) {
	const p = DASH.person(id);
	if (p.avatar) {
		return <img src={p.avatar + (p.avatar.indexOf("?") >= 0 ? "&" : "?") + "s=" + size * 2} alt={p.name} title={title || p.name} loading="lazy"
			style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: p.color, border: "1.5px solid #fff", boxSizing: "border-box", flexShrink: 0, display: "inline-block" }} />;
	}
	return (
		<span
			title={title || p.name}
			style={{
				width: size, height: size, borderRadius: "50%", background: p.color, color: p.fg,
				display: "inline-flex", alignItems: "center", justifyContent: "center",
				fontSize: size <= 20 ? 9 : 11, fontWeight: 500, fontFamily: "var(--font-body)",
				border: "1.5px solid #fff", boxSizing: "border-box", flexShrink: 0
			}}
		>{p.name.slice(0, 1)}</span>
	);
}

function QAvatarStack({ ids, size = 22 }) {
	return (
		<span style={{ display: "inline-flex", paddingLeft: 5 }}>
			{ids.map((id) => (
				<span key={id} style={{ marginLeft: -5, display: "inline-flex" }}><QAvatar id={id} size={size} /></span>
			))}
		</span>
	);
}

function QMergedBadge() {
	return (
		<button
			onClick={DASH.sprinkleBurst}
			title="Merged"
			style={{
				display: "inline-flex", alignItems: "center", gap: 4, border: "none",
				background: "#f1ecf7", color: "var(--woo-purple-dark)", borderRadius: "var(--radius-sm)",
				font: "500 11px/16px var(--font-body)", padding: "2px 8px", cursor: "pointer", flexShrink: 0
			}}
		>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
			</svg>
			Merged
		</button>
	);
}

function QStatusBadge({ status }) {
	const map = {
		"Open": { bg: "var(--woo-lavender-pale)", fg: "var(--woo-purple-dark)" },
		"Approved": { bg: "var(--wpds-color-bg-surface-info-weak)", fg: "var(--info)" },
		"Draft": { bg: "var(--bg-muted)", fg: "var(--fg2)" }
	};
	const c = map[status] || map["Draft"];
	return (
		<span style={{
			background: c.bg, color: c.fg, borderRadius: "var(--radius-sm)",
			font: "500 11px/16px var(--font-body)", padding: "2px 8px", flexShrink: 0
		}}>{status}</span>
	);
}

function QCard({ children, style }) {
	return (
		<div style={Object.assign({
			background: "var(--bg-surface)", border: "1px solid var(--stroke-weak)",
			borderRadius: "var(--radius-lg)", padding: 24, boxSizing: "border-box"
		}, style)}>{children}</div>
	);
}

function QMeta({ pr }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 12px/16px var(--font-body)", color: "var(--fg2)", flexWrap: "wrap" }}>
			<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{pr.repo.split("/")[1]}#{pr.number}</span>
			<span aria-hidden="true">·</span>
			<span>{pr.area}</span>
			<span aria-hidden="true">·</span>
			<span>{pr.when}</span>
		</div>
	);
}

function DashQuiet() {
	const D = DASH;
	return (
		<div data-screen-label="A · Quiet admin" style={{ background: "var(--bg-app)", fontFamily: "var(--font-body)", color: "var(--fg1)", minHeight: "100%", padding: "0 0 48px" }}>
			{/* Top bar */}
			<div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--stroke-weak)", padding: "0 40px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--woo-purple)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
						<svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" /></svg>
					</span>
					<span className="h4">Shipped by design</span>
				</div>
				<a href="#" style={{ font: "400 13px/20px var(--font-body)" }}>View on GitHub ↗</a>
			</div>

			<div style={{ maxWidth: 1064, margin: "0 auto", padding: "40px 40px 0" }}>
				{/* Header */}
				<div style={{ marginBottom: 32 }}>
					<p className="h5" style={{ color: "var(--woo-purple)", marginBottom: 8 }}>Commerce design squad</p>
					<h1 className="h1" style={{ marginBottom: 8 }}>What we're shipping into production</h1>
					<p className="body-lg" style={{ color: "var(--fg2)", margin: 0, maxWidth: 560 }}>
						Five designers making Woo better with real, merged code — one PR at a time.
					</p>
					<div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
						<div style={{ display: "flex", paddingLeft: 6 }}>
							{D.SQUAD.map((p) => (
								<span key={p.id} style={{ marginLeft: -6, display: "inline-flex" }}><QAvatar id={p.id} size={32} /></span>
							))}
						</div>
						<span className="body-md" style={{ color: "var(--fg2)" }}>
							{D.SQUAD.map((p) => p.name).join(", ")}
						</span>
					</div>
					<p className="body-sm" style={{ color: "var(--fg3)", marginTop: 16 }}>
						{D.TOTALS.merged} PRs merged across {D.TOTALS.surfaces} focus areas since {D.TOTALS.since}.
					</p>
				</div>

				{/* Main grid */}
				<div style={{ display: "grid", gridTemplateColumns: "1fr 348px", gap: 24, alignItems: "start" }}>
					{/* Feed */}
					<QCard style={{ padding: 0 }}>
						<div style={{ padding: "16px 24px", borderBottom: "1px solid var(--stroke-weak)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<h2 className="h4" style={{ margin: 0 }}>Recently shipped</h2>
							<a href="#" className="body-sm">All merged PRs ↗</a>
						</div>
						<div>
							{D.MERGED.map((pr, i) => (
								<div key={pr.number} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 24px", borderBottom: i < D.MERGED.length - 1 ? "1px solid var(--stroke-weak)" : "none" }}>
									<QMergedBadge />
									<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
										<span style={{ font: "500 13px/20px var(--font-body)" }}>{pr.title}</span>
										<QMeta pr={pr} />
									</div>
									<QAvatarStack ids={pr.authors.concat(pr.reviewers)} />
								</div>
							))}
						</div>
					</QCard>

					{/* Right rail */}
					<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
						<QCard style={{ padding: 0 }}>
							<div style={{ padding: "16px 24px", borderBottom: "1px solid var(--stroke-weak)" }}>
								<h2 className="h4" style={{ margin: 0 }}>In flight</h2>
							</div>
							{D.OPEN.map((pr, i) => (
								<div key={pr.number} style={{ padding: "12px 24px", borderBottom: i < D.OPEN.length - 1 ? "1px solid var(--stroke-weak)" : "none", display: "flex", flexDirection: "column", gap: 6 }}>
									<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
										<QStatusBadge status={pr.status} />
										<QAvatarStack ids={pr.authors} size={20} />
									</div>
									<span style={{ font: "400 13px/18px var(--font-body)" }}>{pr.title}</span>
									<span style={{ font: "400 11px/16px var(--font-body)", color: "var(--fg3)" }}>{pr.area} · {pr.when}</span>
								</div>
							))}
						</QCard>

						<QCard>
							<h2 className="h4" style={{ margin: "0 0 4px" }}>Focus areas we've touched</h2>
							<p className="body-sm" style={{ color: "var(--fg2)", margin: "0 0 16px" }}>Merged PRs by product area</p>
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
								{D.AREAS.map((a) => (
									<div key={a.name} style={{ border: "1px solid var(--stroke-weak)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
										<span style={{ font: "500 12px/16px var(--font-body)" }}>{a.name}</span>
										<span style={{ font: "400 11px/16px var(--font-body)", color: "var(--woo-purple)" }}>{a.count} {a.count === 1 ? "PR" : "PRs"}</span>
									</div>
								))}
							</div>
						</QCard>
					</div>
				</div>

				<p className="body-sm" style={{ color: "var(--fg3)", marginTop: 32, textAlign: "center" }}>
					psst — click a merged badge. &nbsp;·&nbsp; Code is poetry.
				</p>
			</div>
		</div>
	);
}

Object.assign(window, { DashQuiet });
