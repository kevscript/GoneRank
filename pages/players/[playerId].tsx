import Draggable from "@/components/shared/Draggable";
import PlayerTable from "@/components/tables/PlayerTable";
import {
  formatPlayerSeasonStats,
  FormattedPlayerSeasonStats,
} from "@/utils/formatPlayerSeasonStats";
import {
  GetSeasonsQuery,
  useGetSeasonsQuery,
  usePlayerSeasonDataLazyQuery,
  usePlayerSeasonRatingsLazyQuery,
} from "graphql/generated/queryTypes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getAgeFromDate } from "@/utils/getAgeFromDate";
import Spinner from "@/components/shared/Spinner";
import { WhoFilterOptions } from "@/components/shared/WhoFilter";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import Head from "next/head";
import OptionsFilter from "@/components/OptionsFilter";
import { VisualFilterOptions } from "@/components/shared/VisualFilter";

const PlayerPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { playerId } = router.query;

  const [seasonsPlayed, setSeasonsPlayed] = useState<
    GetSeasonsQuery["seasons"] | null
  >(null);

  const { data: { seasons } = {} } = useGetSeasonsQuery();

  const [
    getPlayerSeasonData,
    {
      data: { clubs, competitions, matches, player } = {
        clubs: undefined,
        competitions: undefined,
        matches: undefined,
        player: undefined,
      },
    },
  ] = usePlayerSeasonDataLazyQuery();

  const [
    getPlayerSeasonRatings,
    { data: { ratings: playerSeasonRatings } = { ratings: undefined } },
  ] = usePlayerSeasonRatingsLazyQuery();

  const [communityStats, setCommunityStats] = useState<
    FormattedPlayerSeasonStats[] | null
  >(null);
  const [userStats, setUserStats] = useState<
    FormattedPlayerSeasonStats[] | null
  >(null);

  const [whoFilter, setWhoFilter] = useState<WhoFilterOptions>("community");
  const toggleWho = (newWho: WhoFilterOptions) => {
    if (newWho !== whoFilter) setWhoFilter(newWho);
  };

  const [visualFilter, setVisualFilter] =
    useState<VisualFilterOptions>("table");
  const toggleVisual = (newVisual: VisualFilterOptions) => {
    if (newVisual !== visualFilter) setVisualFilter(newVisual);
  };

  const [currentSeasonId, setCurrentSeasonId] = useState("");
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSeasonId = e.target.value;
    if (selectedSeasonId !== currentSeasonId) {
      setCurrentSeasonId(selectedSeasonId);
    }
  };

  const [currentCompetitionId, setCurrentCompetitionId] = useState("all");
  const handleCompetitionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCompetitionId = e.target.value;
    if (selectedCompetitionId !== currentCompetitionId) {
      setCurrentCompetitionId(selectedCompetitionId);
    }
  };

  // setting the initial season
  useEffect(() => {
    if (seasons && !currentSeasonId) {
      const playedSeasons = seasons.filter((s) =>
        s.players.some((p) => p.playerId === (playerId as string))
      );

      if (playedSeasons.length > 0) {
        setSeasonsPlayed(playedSeasons);

        const latestSeason = playedSeasons.sort((a, b) =>
          new Date(a.startDate) < new Date(b.startDate) ? 1 : -1
        )[0];
        latestSeason && setCurrentSeasonId(latestSeason.id);
      }
    }
  }, [seasons, currentSeasonId, playerId]);

  // fetching data whenever season changes
  useEffect(() => {
    if (currentSeasonId && playerId) {
      getPlayerSeasonData({
        variables: {
          playerId: playerId as string,
          seasonId: currentSeasonId,
          archived: true,
        },
      });
      getPlayerSeasonRatings({
        variables: {
          playerId: playerId as string,
          seasonId: currentSeasonId,
          archived: true,
        },
      });
    }
  }, [playerId, currentSeasonId, getPlayerSeasonData, getPlayerSeasonRatings]);

  useEffect(() => {
    if (matches && playerSeasonRatings) {
      const filteredMatches =
        currentCompetitionId === "all"
          ? matches
          : matches.filter((m) => m.competitionId === currentCompetitionId);

      const formattedStats = formatPlayerSeasonStats({
        matches: filteredMatches || [],
        competitions: competitions || [],
        clubs: clubs || [],
        ratings:
          currentCompetitionId === "all"
            ? playerSeasonRatings
            : playerSeasonRatings.filter((r) =>
                filteredMatches.some((m) => m.id === r.matchId)
              ),
      });
      formattedStats && setCommunityStats(formattedStats);
    }
  }, [playerSeasonRatings, matches, competitions, clubs, currentCompetitionId]);

  // if the ratings are here and a user is authenticated, filter his ratings
  useEffect(() => {
    if (matches && playerSeasonRatings && status === "authenticated") {
      const currentUserRatings = playerSeasonRatings.filter(
        (r) => r.userId === session.user.id
      );

      const filteredMatches =
        currentCompetitionId === "all"
          ? matches
          : matches.filter((m) => m.competitionId === currentCompetitionId);

      const formattedStats = formatPlayerSeasonStats({
        matches: filteredMatches || [],
        competitions: competitions || [],
        clubs: clubs || [],
        ratings:
          currentCompetitionId === "all"
            ? currentUserRatings
            : currentUserRatings.filter((r) =>
                filteredMatches.some((m) => m.id === r.matchId)
              ),
      });

      currentUserRatings && setUserStats(formattedStats);
    }
  }, [
    playerSeasonRatings,
    status,
    session,
    matches,
    competitions,
    clubs,
    currentCompetitionId,
  ]);

  if (!communityStats) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <Head>
          <title>
            Gonerank -{" "}
            {player ? player.firstName + " " + player.lastName : "Joueur"}
          </title>
          <meta
            name="description"
            content="Page avec les statistiques pour un joueur"
          />
        </Head>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <Head>
        <title>
          Gonerank -{" "}
          {player ? player.firstName + " " + player.lastName : "Joueur"}
        </title>
        <meta
          name="description"
          content={`Page des statistiques pour ${
            player ? player.firstName + " " + player.lastName : "un joueur"
          }`}
        />
      </Head>
      <Breadcrumbs
        crumbs={[
          { label: "Accueil", path: "/" },
          { label: "Joueurs", path: "/players" },
          {
            label: player ? `${player.firstName} ${player.lastName}` : "",
            path: `/players/${playerId}`,
          },
        ]}
      />

      {player && (
        <div className="w-full p-4 md:py-0 md:px-4 lg:px-8 2xl:px-16">
          <div className="flex flex-row items-center w-full px-4 py-4 overflow-hidden bg-white rounded dark:bg-dark-500 lg:px-8 flex-nowrap drop-shadow-sm">
            <div className="relative flex items-center justify-center w-12 h-12 overflow-hidden bg-gray-100 rounded-full shadow-inner dark:bg-dark-300 lg:h-16 lg:w-16 shrink-0">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${player.image}`}
                alt="player avatar"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex flex-col flex-1 ml-4">
              <h3 className="overflow-hidden truncate lg:text-xl whitespace-nowrap">{`${player.firstName} ${player.lastName}`}</h3>
              <div className="flex items-center">
                <span className="mr-2 text-sm whitespace-nowrap">
                  {getAgeFromDate(player.birthDate)} ans
                </span>
                <Image
                  className="drop-shadow-sm"
                  src={`https://countryflagsapi.com/png/${player.countryCode}`}
                  height={12}
                  width={18}
                  alt={player.country}
                  title={player.country}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full p-4 md:py-8 md:px-4 lg:px-8 2xl:px-16`}>
        <OptionsFilter
          isAuth={status === "authenticated" && userStats ? true : false}
          who={whoFilter}
          toggleWho={toggleWho}
          visual={visualFilter}
          toggleVisual={toggleVisual}
          competitions={competitions}
          seasons={seasons}
          currentCompetitionId={currentCompetitionId}
          currentSeasonId={currentSeasonId}
          handleCompetitionChange={handleCompetitionChange}
          handleSeasonChange={handleSeasonChange}
        />
      </div>

      {visualFilter === "table" && (
        <>
          <div
            className={`flex flex-col w-full p-4 md:py-0 md:px-4 lg:px-8 2xl:px-16 flex-1 justify-center`}
          >
            <Draggable>
              <PlayerTable
                data={
                  userStats && whoFilter === "user" ? userStats : communityStats
                }
              />
            </Draggable>
            {communityStats.length === 0 && (
              <div className="flex items-center justify-center mt-4">
                <div className="flex flex-col items-center justify-center w-full p-4 text-center border rounded bg-marine-100 border-marine-200 text-marine-400 md:p-8 dark:bg-marine-900/10 dark:border-marine-400">
                  <p>
                    Aucun match n&apos;est encore disponible pour cette saison.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {visualFilter === "chart" && (
        <div
          className={`w-full p-4 md:py-0 md:px-4 lg:px-8 2xl:px-16 flex-1 overflow-hidden scroll-hide`}
        >
          Charts
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
