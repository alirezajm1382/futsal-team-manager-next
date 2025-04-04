import { Player, PlayerRole } from "@/models/types";
import "./PlayerListView.css";

interface PlayerListViewProps {
  players: Player[];
  variant?: "default" | "compact" | "detailed";
}

function PlayerListView({ players, variant = "default" }: PlayerListViewProps) {
  const getPositionColor = (position: PlayerRole): string => {
    const colors: Record<PlayerRole, string> = {
      Pivot: "#ff6b6b",
      Ala: "#4dabf7",
      Fixo: "#51cf66",
      Universal: "#845ef7",
      Goleiro: "#ffd43b",
    };
    return colors[position] || "#868e96";
  };

  return (
    <div className={`player-list-view ${variant}`}>
      {players.map((player) => (
        <div key={player.id} className="player-list-item">
          <span className="player-name">{player.name}</span>
          <div className="player-details">
            <span
              className="player-position"
              style={{ backgroundColor: getPositionColor(player.position) }}
            >
              {player.position}
            </span>
            {player.overallScore && (
              <span className="player-score">
                {player.overallScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlayerListView;
