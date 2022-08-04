import CloseIcon from "@/components/Icons/Close";
import PlayerIcon from "@/components/Icons/Player";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { NextCustomPage } from "@/pages/_app";
import {
  GetClubsQuery,
  GetCompetitionsQuery,
  GetSeasonPlayersQuery,
  useGetClubsQuery,
  useGetCompetitionsQuery,
  useGetMatchLazyQuery,
  useGetPlayersQuery,
  useGetSeasonPlayersLazyQuery,
  useUpdateMatchPlayersMutation,
} from "graphql/generated/queryTypes";
import { GET_MATCH } from "graphql/queries/match";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export type SquadPlayerType =
  GetSeasonPlayersQuery["seasonPlayers"][0]["player"];

const AdminMatchSquadPage: NextCustomPage = () => {
  const [opponent, setOpponent] = useState<GetClubsQuery["clubs"][0] | null>(
    null
  );
  const [competition, setCompetition] = useState<
    GetCompetitionsQuery["competitions"][0] | null
  >(null);

  const [initialSquad, setInitialSquad] = useState<SquadPlayerType[] | null>(
    null
  );
  const [squad, setSquad] = useState<SquadPlayerType[] | null>(null);

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const router = useRouter();
  const { matchId } = router.query;

  const [
    getMatch,
    { data: matchData, loading: matchLoading, error: matchError },
  ] = useGetMatchLazyQuery();
  const { data: playersData } = useGetPlayersQuery();
  const { data: clubsData } = useGetClubsQuery();
  const [getSeasonPlayers, { data: seasonPlayersData }] =
    useGetSeasonPlayersLazyQuery();
  const { data: competitionsData } = useGetCompetitionsQuery();

  const [updateMatchPlayers] = useUpdateMatchPlayersMutation({
    refetchQueries: [
      { query: GET_MATCH, variables: { id: matchId as string } },
    ],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    matchId && getMatch({ variables: { id: matchId as string } });
  }, [matchId, getMatch]);

  useEffect(() => {
    if (matchData) {
      getSeasonPlayers({
        variables: { where: { seasonId: matchData.match.seasonId } },
      });
    }
  }, [matchData, getSeasonPlayers]);

  useEffect(() => {
    if (matchData && clubsData && competitionsData && seasonPlayersData) {
      const currOpponent = clubsData.clubs.find(
        (c) => c.id === matchData.match.opponentId
      );
      currOpponent && setOpponent(currOpponent);
      const currCompetition = competitionsData.competitions.find(
        (c) => c.id === matchData.match.competitionId
      );
      currCompetition && setCompetition(currCompetition);

      const currSquad = matchData.match.players.map((mp) => {
        const seasonPlayer = seasonPlayersData.seasonPlayers.find(
          (sp) => sp.player.id === mp.playerId
        )!;
        return seasonPlayer.player;
      });

      currSquad && setSquad(currSquad);
      currSquad && setInitialSquad(currSquad);
    }
  }, [matchData, clubsData, competitionsData, seasonPlayersData]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (playersData && squad) {
      const selectedPlayerId = e.target.value;
      if (selectedPlayerId === "empty") return;
      const newSquad = [...squad];
      const playerToAdd = playersData.players.find(
        (p) => p.id === selectedPlayerId
      );
      if (playerToAdd) {
        newSquad.push(playerToAdd);
        setSquad(newSquad);
      }
    }
  };

  const handleRemove = (id: string) => {
    if (squad) {
      const newSquad = squad.filter((p) => p.id !== id);
      setSquad(newSquad);
    }
  };

  const handleConfirm = () => {
    if (squad) {
      const playerIds = squad?.map((p) => p.id);
      updateMatchPlayers({
        variables: { matchId: matchId as string, playerIds: playerIds },
      });
      setModalIsOpen(false);
      router.push("/admin/matches");
    }
  };

  if (matchLoading) return <div>Loading...</div>;
  if (matchError) return <span>{matchError.message}</span>;

  return (
    <>
      <div className="flex items-end bg-gray-100 h-16 p-4 gap-x-2">
        <div className="w-6 h-6 rounded-full overflow-hidden flex justify-center items-center bg-gray-200 mr-2">
          <PlayerIcon className="w-3 h-3 fill-marine-600" />
        </div>
        {opponent && <span>{opponent.abbreviation}</span>}
        {competition && <span>{competition.abbreviation}</span>}
        {matchData && (
          <span>{new Date(matchData.match.date).toLocaleDateString()}</span>
        )}
      </div>
      <div className="p-4">
        <div className="mt-4">
          <label>
            <select onChange={handleSelect} className="w-full h-10 px-2">
              <option value="empty">-- select a player --</option>
              {squad &&
                seasonPlayersData &&
                seasonPlayersData.seasonPlayers
                  .filter((sp) => !squad.some((p) => p.id === sp.player.id))
                  .map((sp) => (
                    <option key={sp.player.id} value={sp.player.id}>
                      {sp.player.firstName + " " + sp.player.lastName}
                    </option>
                  ))}
            </select>
          </label>
        </div>
        <ul className="flex flex-col flex-nowrap gap-y-1 mt-4 lg:flex-row lg:flex-wrap lg:gap-2">
          {squad &&
            squad.map((p) => (
              <li
                key={p.id}
                className="relative p-2 w-full bg-white border border-gray-100 flex items-center justify-between flex-nowrap lg:max-w-xs"
              >
                <span>{p.firstName + " " + p.lastName}</span>
                <div
                  className="w-4 h-4 flex justify-center items-center cursor-pointer"
                  onClick={() => handleRemove(p.id)}
                >
                  <CloseIcon className="w-3 h-3" />
                </div>
              </li>
            ))}
        </ul>

        <div className="w-full flex justify-end gap-x-2 mt-4">
          <Button
            label="Annuler"
            onClick={() => router.push("/admin/matches")}
          />
          <Button label="Soumettre" onClick={() => setModalIsOpen(true)} />
        </div>
        <Modal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)}>
          <>
            <div className="w-full">
              <span>Current Squad :</span>
            </div>
            <div className="mt-4">
              <ul className="text-sm flex flex-wrap gap-1">
                {initialSquad &&
                  squad &&
                  squad.map((p) => {
                    const alreadyExisted = initialSquad.some(
                      (player) => player.id === p.id
                    );
                    if (alreadyExisted) {
                      return (
                        <li
                          key={p.id}
                          className="w-48 bg-gray-50 border border-gray-200 p-1 flex flex-nowrap"
                        >
                          <div className="w-4 h-full flex justify-center items-center">
                            =
                          </div>
                          <span className="flex-1 ml-2">
                            {p.firstName[0] + ". " + p.lastName}
                          </span>
                        </li>
                      );
                    } else {
                      return (
                        <li
                          key={p.id}
                          className="w-48 bg-marine-50 p-1 border border-marine-300 text-marine-900 flex flex-nowrap"
                        >
                          <div className="w-4 h-full flex justify-center items-center">
                            +
                          </div>
                          <span className="flex-1 ml-2">
                            {p.firstName[0] + ". " + p.lastName}
                          </span>
                        </li>
                      );
                    }
                  })}
                {initialSquad &&
                  squad &&
                  initialSquad
                    .filter((p) => !squad.some((player) => player.id === p.id))
                    .map((p) => (
                      <li
                        key={p.id}
                        className="w-48 bg-red-100 p-1 border border-red-300 text-red-900 flex flex-nowrap"
                      >
                        <div className="w-4 h-full flex justify-center items-center">
                          -
                        </div>
                        <span className="flex-1 ml-2">
                          {p.firstName[0] + ". " + p.lastName}
                        </span>
                      </li>
                    ))}
              </ul>
            </div>
            <div className="w-full flex justify-end flex-nowrap gap-x-2 mt-4">
              <Button label="Annuler" onClick={() => setModalIsOpen(false)} />
              <Button label="Confirm" onClick={handleConfirm} />
            </div>
          </>
        </Modal>
      </div>
    </>
  );
};

AdminMatchSquadPage.isAdminPage = true;
export default AdminMatchSquadPage;
