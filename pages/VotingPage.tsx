"use client";

// Components
import Image from "next/image";
import PlayerVote from "@/components/PlayerVote";

// Models
import {
  calculateAverageStats,
  hasVoted,
  calculatePlayerScoreFromVotes,
  validateVote,
} from "@/models/voteModels";
import { calculateOverallScore, playerAttributes } from "@/models/playerModels";
import { Player, Vote } from "@/models/types";

// Hooks
import { useVoting, usePlayers } from "@/utils/logic";
import { useState, useEffect } from "react";

// Styles
import "./VotingPage.css";

interface VoteWithVoter extends Vote {
  voterName: string;
}

type VotesRecord = Record<string, VoteWithVoter[]>;

const VotingPage = () => {
  const { updatePlayer, players } = usePlayers();
  const { getVotes, saveVotes } = useVoting();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentVoter, setCurrentVoter] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<VotesRecord>({});

  // Load votes from local storage on component mount
  useEffect(() => {
    const storedVotes = getVotes();
    // Ensure we have a valid votes object
    if (storedVotes && typeof storedVotes === "object") {
      setVotes(storedVotes as VotesRecord);

      // Update all players with their calculated scores
      if (players && Object.keys(storedVotes).length > 0) {
        players.forEach((player) => {
          const playerVotes = (storedVotes as VotesRecord)[player.id] || [];
          if (playerVotes.length > 0) {
            const updatedPlayer = calculatePlayerScoreFromVotes(
              playerVotes,
              player
            );
            updatePlayer(updatedPlayer);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitVote = (vote: any) => {
    if (!currentVoter || !selectedPlayer) return;

    const voteWithVoter: VoteWithVoter = {
      ...vote,
      id: `vote-${Date.now()}`,
      voterId: currentVoter.id,
      voterName: currentVoter.name,
      timestamp: new Date(),
    };

    if (validateVote(voteWithVoter)) {
      // Update votes in state and local storage
      const updatedVotes = {
        ...votes,
        [selectedPlayer.id]: [
          ...(votes[selectedPlayer.id] || []),
          voteWithVoter,
        ],
      };
      setVotes(updatedVotes);
      saveVotes(updatedVotes);

      // Calculate and update player's scores
      const updatedPlayer = calculatePlayerScoreFromVotes(
        updatedVotes[selectedPlayer.id],
        selectedPlayer
      );
      updatePlayer(updatedPlayer);

      // Reset selected player
      setSelectedPlayer(null);
    } else {
      setError("Invalid vote data. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveVote = (playerId: string) => {
    if (!currentVoter) return;

    // Get current votes for the player
    const playerVotes = votes[playerId] || [];

    // Remove the current voter's vote
    const updatedPlayerVotes = playerVotes.filter(
      (vote) => vote.voterId !== currentVoter.id
    );

    // Update votes state and storage
    const updatedVotes = {
      ...votes,
      [playerId]: updatedPlayerVotes,
    };
    setVotes(updatedVotes);
    saveVotes(updatedVotes);

    // Recalculate player's scores
    const player = players.find((p) => p.id === playerId);
    if (player) {
      // If no votes left, reset player attributes to initial values
      let updatedPlayer;
      if (updatedPlayerVotes.length === 0) {
        updatedPlayer = {
          ...player,
          // Reset all attributes to initial values (50)
          ...Object.keys(playerAttributes).reduce<Record<string, number>>(
            (acc, key) => {
              if (key in playerAttributes) {
                acc[key] = 50;
              }
              return acc;
            },
            {}
          ),
        };
      } else {
        // Calculate new scores from remaining votes
        updatedPlayer = calculatePlayerScoreFromVotes(
          updatedPlayerVotes,
          player
        );
      }
      updatePlayer(updatedPlayer);
    }

    setError("Vote removed successfully");
    setTimeout(() => setError(null), 3000);
  };

  // If no voter is selected, show the voter selection screen
  if (!currentVoter) {
    return (
      <div className="voting-page">
        <div className="voter-selection">
          <h2>Select Your Player</h2>
          <div className="player-grid">
            {players.map((player) => (
              <div
                key={player.id}
                className="player-vote-card"
                onClick={() => setCurrentVoter(player)}
              >
                <div className="player-info">
                  <div className="player-photo-container">
                    {player.photoUrl ? (
                      <Image
                        src={player.photoUrl}
                        alt={player.name}
                        className="player-photo"
                      />
                    ) : (
                      <div className="player-photo-placeholder">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="player-details">
                    <h3>{player.name}</h3>
                    <span className="position">{player.position}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If a voter is selected but no player is selected to vote on
  if (!selectedPlayer) {
    return (
      <div className="voting-page">
        <div className="voter-selection">
          <h2>Vote for Players</h2>
          <h3 className="current-voter">Voting as: {currentVoter.name}</h3>
          {error && <div className="error-message">{error}</div>}
          <div className="player-grid">
            {players
              .filter((p) => p.id !== currentVoter.id)
              .map((player) => {
                const playerVotes = votes[player.id] || [];
                const hasAlreadyVoted = hasVoted(
                  playerVotes,
                  currentVoter.id,
                  player.id
                );

                return (
                  <div
                    key={player.id}
                    className={`player-vote-card ${
                      hasAlreadyVoted ? "voted" : ""
                    }`}
                    onClick={() => {
                      if (hasAlreadyVoted) {
                        setError("You have already voted for this player");
                        setTimeout(() => setError(null), 3000);
                        return;
                      }
                      setError(null);
                      setSelectedPlayer(player);
                    }}
                  >
                    <div className="player-info">
                      <div className="player-photo-container">
                        {player.photoUrl ? (
                          <Image
                            src={player.photoUrl}
                            alt={player.name}
                            className="player-photo"
                          />
                        ) : (
                          <div className="player-photo-placeholder">
                            {player.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="player-details">
                        <h3>{player.name}</h3>
                        <span className="position">{player.position}</span>
                      </div>
                    </div>
                    <div className="vote-stats">
                      <span>{playerVotes.length} votes</span>
                      {hasAlreadyVoted && (
                        <>
                          <span className="voted-badge">Voted</span>
                          <button
                            className="remove-vote-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVote(player.id);
                            }}
                          >
                            Remove Vote
                          </button>
                        </>
                      )}
                      <div className="current-score">
                        Score: {calculateOverallScore(player, player.position)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voter-selection">
        <h2>Rate Player: {selectedPlayer.name}</h2>
        <PlayerVote player={selectedPlayer} onSubmitVote={handleSubmitVote} />
      </div>
    </div>
  );
};

export default VotingPage;
