import { AxisLeft, AxisBottom } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath } from "@visx/shape";
import * as curves from "@visx/curve";
import { Grid } from "@visx/grid";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";

import { getContrastColor } from "@/utils/getContrastColor";
import { FormattedPlayerChartData } from "@/utils/charts/formatPlayerChartData";

type VisxPlayerAvgLinearChartProps = {
  matches: FormattedPlayerChartData[];
  theme: string;
  dimensions?: { width: number; height: number };
};

type TooltipData = {
  match: FormattedPlayerChartData;
};

const defaultDimensions = { width: 600, height: 400 };

const VisxPlayerAvgLinearChart = ({
  matches,
  dimensions = defaultDimensions,
  theme,
}: VisxPlayerAvgLinearChartProps) => {
  const { width, height } = dimensions;

  const margin = { top: 32, right: 32, bottom: 48, left: 32 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scalePoint({
    domain: [...matches.map((match) => match.date)],
    range: [0, xMax],
    padding: 0.5,
  });

  const refScale = scalePoint({
    domain: [...matches.map((match) => match.date)],
    range: [0, xMax],
  });

  const yScale = scaleLinear<number>({
    domain: [0, 10],
    nice: true,
    range: [yMax, 0],
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip({ tooltipData: {} as TooltipData });

  const handlePointHover = (
    e: React.MouseEvent<SVGCircleElement>,
    data: { matchId: string }
  ) => {
    const hoveredMatch = matches.find((m) => m.id === data.matchId);

    if (hoveredMatch) {
      const info: TooltipData = {
        match: hoveredMatch,
      };

      showTooltip({
        tooltipLeft: e.clientX,
        tooltipTop: e.clientY,
        tooltipData: info,
      });
    }
  };

  return (
    <>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <AxisLeft
            scale={yScale}
            tickValues={[1, 3, 5, 7, 9]}
            tickLength={4}
            stroke={theme === "dark" ? "#eeeeee" : "#111111"}
            tickStroke={theme === "dark" ? "#eeeeee" : "#111111"}
            tickLabelProps={() => ({
              style: {
                fontSize: 12,
                fill: theme === "dark" ? "#eeeeee" : "#111111",
                textAnchor: "end",
              },
              dy: 4,
              dx: -4,
            })}
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            tickLength={4}
            tickFormat={(d) =>
              new Date(d).toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              })
            }
            stroke={theme === "dark" ? "#eeeeee" : "#111111"}
            tickStroke={theme === "dark" ? "#eeeeee" : "#111111"}
            tickLabelProps={() => ({
              style: {
                fill: theme === "dark" ? "#eeeeee" : "#111111",
                fontSize: 12,
                textAnchor: "middle",
              },
              dy: 4,
            })}
          />
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            rowTickValues={[1, 3, 5, 7, 9]}
            numTicksColumns={matches.length}
            stroke={theme === "dark" ? "#eeeeee" : "#111111"}
            strokeWidth={0.5}
            strokeOpacity={theme === "dark" ? 0.25 : 0.1}
            numTicksRows={0}
          />
          <Group>
            <LinePath
              data={matches}
              x={(d) => refScale(d.date)!}
              y={yScale(5)}
              stroke={theme === "dark" ? "#eeeeee" : "#111111"}
              strokeWidth={0.5}
              strokeOpacity={theme === "dark" ? 1 : 0.5}
              strokeDasharray={4}
            />
          </Group>

          <Group>
            <LinePath
              className={`${
                theme === "dark" ? "stroke-marine-600" : "stroke-marine-400"
              }`}
              data={matches.filter((m) => m.averageQuantity)}
              defined={(d) => d.averageQuantity !== undefined}
              curve={curves["curveMonotoneX"]}
              x={(d) => xScale(d.date)!}
              y={(d) =>
                d.averageQuantity ? yScale(d.averageSum / d.averageQuantity) : 0
              }
              strokeWidth={2}
              strokeOpacity={1}
            />
            {matches.map((m, i) => {
              return (
                m.averageQuantity && (
                  <circle
                    className={`cursor-pointer  hover:stroke-2 ${
                      theme === "dark"
                        ? "hover:stroke-white fill-marine-400"
                        : "hover:stroke-black fill-marine-600"
                    }`}
                    key={`${m.id}`}
                    r={3}
                    cx={xScale(m.date)!}
                    cy={yScale(m.averageSum / m.averageQuantity)}
                    onMouseOver={(e) => handlePointHover(e, { matchId: m.id })}
                    onMouseOut={hideTooltip}
                  />
                )
              );
            })}
          </Group>
        </Group>
      </svg>

      {tooltipOpen && (
        <TooltipWithBounds
          className="!p-0 border border-gray-400 !rounded-sm !bg-gray-400"
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          <div className="flex flex-col flex-nowrap gap-y-[1px] z-30 rounded-sm">
            <div className="flex w-full flex-nowrap gap-x-[1px]">
              <div className="flex flex-col flex-nowrap gap-y-[1px]">
                <div className="flex justify-between w-full gap-x-[1px]">
                  <div
                    className="flex items-center justify-center flex-1 px-2 py-1 text-xs font-bold text-white"
                    style={{
                      backgroundColor: tooltipData?.match.opponent?.primary,
                      color: tooltipData
                        ? getContrastColor(tooltipData.match.opponent.primary)
                        : "white",
                    }}
                  >
                    {tooltipData?.match.opponent?.abbreviation}
                  </div>
                  <div className="justify-center px-2 py-1 text-xs bg-gray-100">
                    {tooltipData?.match.home ? "H" : "A"}
                  </div>
                </div>
                <div className="flex justify-between w-full gap-x-[1px]">
                  <div className="justify-center flex-1 px-2 py-1 text-xs bg-gray-100">
                    {tooltipData?.match.competition?.abbreviation}
                  </div>
                  <div className="justify-center px-2 py-1 text-xs bg-gray-100">
                    {new Date(tooltipData!.match.date).toLocaleDateString(
                      undefined,
                      {
                        month: "numeric",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center min-w-[48px] flex-1 text-base font-bold bg-gray-200 font-num text-black">
                <span>
                  {tooltipData?.match.averageQuantity &&
                    (
                      tooltipData?.match.averageSum /
                      tooltipData?.match.averageQuantity
                    ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};

export default VisxPlayerAvgLinearChart;