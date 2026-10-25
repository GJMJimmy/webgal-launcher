import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Game } from "../../shared/types";
import { formatYear, sourceBadge } from "../utils";
import { CoverImage } from "./CoverImage";
import { ArrowRightIcon, StarIcon } from "./Icons";

interface GameCardProps {
  game: Game;
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const year = formatYear(game.releaseDate);
  const meta = [game.developer, year].filter(Boolean).join(" · ");

  return (
    <Link
      className="game-card"
      to={`/game/${game.id}`}
      style={{ "--card-delay": `${Math.min(index, 12) * 38}ms` } as CSSProperties}
      aria-label={`查看 ${game.title} 的详情`}
    >
      <div className="game-card-poster">
        <CoverImage src={game.cover} title={game.title} className="game-cover" />
        <div className="poster-shade" />
        {game.rating !== null ? (
          <span className="score-badge">
            <StarIcon size={11} />
            {game.rating.toFixed(1)}
          </span>
        ) : null}
        {game.featured ? <span className="pick-badge">PICK</span> : null}
        <span className="poster-source">{sourceBadge(game)}</span>
        <span className="card-reveal">
          查看详情
          <ArrowRightIcon size={14} />
        </span>
      </div>
      <div className="game-card-body">
        <h3 title={game.title}>{game.title}</h3>
        {game.originalTitle ? (
          <p className="game-original" title={game.originalTitle}>
            {game.originalTitle}
          </p>
        ) : null}
        <p className="game-meta">{meta || "等待补完资料"}</p>
        {game.tags.length > 0 ? (
          <div className="game-card-tags">
            {game.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="mini-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="game-card skeleton-card" aria-hidden="true">
      <div className="game-card-poster skeleton-block" />
      <div className="game-card-body">
        <div className="skeleton-line wide" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}
