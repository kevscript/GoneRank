import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { FormattedPlayersChartData } from "@/utils/charts/formatPlayersChartData";

type PlayersAvgProgressChartProps = {
  players: FormattedPlayersChartData[];
  idsToShow: string[];
  highlightPlayer: (id: string | null) => void;
  highlightedPlayer: string | null;
};

const PlayersAvgProgressChart = ({
  players,
  idsToShow,
  highlightPlayer,
  highlightedPlayer,
}: PlayersAvgProgressChartProps) => {
  const getDomain = () => {
    let highestAvg = 0;
    let lowestAvg = 10;

    players.forEach((player) => {
      player.matches.forEach((m) => {
        if (typeof m.avgProgress === "number") {
          if (m.avgProgress > highestAvg) highestAvg = m.avgProgress;
          if (m.avgProgress < lowestAvg) lowestAvg = m.avgProgress;
        }
      });
    });

    return [Math.floor(lowestAvg), Math.ceil(highestAvg)];
  };

  if (!players) return null;
  return (
    <ResponsiveContainer aspect={16.0 / 9.0} height="56.25%">
      <LineChart margin={{ top: 0, right: 32, left: -32, bottom: 0 }}>
        <XAxis
          dataKey={(x) => {
            return new Date(x.date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
            });
          }}
          allowDuplicatedCategory={false}
          stroke="white"
          tickMargin={8}
          axisLine={false}
        />
        <YAxis
          type="number"
          dataKey="avgProgress"
          domain={getDomain()}
          stroke="white"
          tickMargin={8}
          axisLine={false}
        />
        <ReferenceLine y={5} strokeDasharray="1 5" strokeOpacity="1" />
        <CartesianGrid
          stroke="#ffffff"
          strokeDasharray="1 5"
          strokeOpacity="1"
          fill="#1f1f1f"
          fillOpacity={0.4}
        />
        {players
          .filter((p) => p.matches.length > 0)
          .sort((a, b) => (a.globalAverage > b.globalAverage ? 1 : -1))
          .map((player, i) => (
            <Line
              key={player.id}
              data={player.matches}
              type="monotone"
              dataKey="avgProgress"
              stroke={`hsla(${
                (360 / idsToShow.length) * idsToShow.indexOf(player.id) + 1
              }, 100%, 50%, ${
                highlightedPlayer === null
                  ? "90%"
                  : highlightedPlayer === player.id
                  ? "100%"
                  : "10%"
              })`}
              strokeWidth={2}
              name={player.lastName}
              isAnimationActive={false}
              className={`${!idsToShow.includes(player.id) && "hidden"}`}
              dot={
                highlightedPlayer === null || highlightedPlayer === player.id
                  ? true
                  : false
              }
            >
              <LabelList
                valueAccessor={(x: any) => x.value}
                position="top"
                content={(props) => {
                  const { x, y, stroke, value } = props;
                  if (highlightedPlayer === player.id) {
                    return (
                      <foreignObject
                        x={Number(x) - 24}
                        y={value! > 5 ? Number(y) + 10 : Number(y) - 36}
                        width={48}
                        height={32}
                      >
                        <div
                          className="flex items-center justify-center text-white border rounded"
                          style={{
                            borderColor: `hsla(${
                              (360 / idsToShow.length) *
                                idsToShow.indexOf(player.id) +
                              1
                            }, 100%, 50%, 100%)`,
                            background: `hsla(${
                              (360 / idsToShow.length) *
                                idsToShow.indexOf(player.id) +
                              1
                            }, 50%, 50%, 100%)`,
                          }}
                        >
                          {value}
                        </div>
                      </foreignObject>
                    );
                  } else {
                    return null;
                  }
                }}
              />
            </Line>
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PlayersAvgProgressChart;
