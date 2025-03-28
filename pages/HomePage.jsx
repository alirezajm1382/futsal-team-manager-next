"use client";

import PlayerList from "@/components/PlayerList";
import { usePlayers } from "@/utils/logic";
const HomePage = () => {
  const { players, updatePlayer, deletePlayer } = usePlayers();

  return (
    <div>
      <PlayerList
        players={players}
        onDeletePlayer={deletePlayer}
        onUpdatePlayer={updatePlayer}
      />
    </div>
  );
};

export default HomePage;
