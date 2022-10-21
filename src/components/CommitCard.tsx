import { FunctionComponent, useEffect, useRef } from "react";
import { ResponseCommit } from "../pages/api/commit/list";
import { AiOutlineFile } from "react-icons/ai";
import dayjs from "dayjs";

export const CommitCard: FunctionComponent<{ commit: ResponseCommit }> = ({ commit }) => {
  const { sha, message, repository, date, url, branches, changedFiles, additions, deletions } = commit;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const canvasWidth = 80;
    const canvasHeight = 128;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const hexList: string[] = [];
    for (let i = 0; i < sha.length; i += 2) {
      hexList.push(sha.substring(i, i + 2));
    }
    const bytes = hexList.map((hex) => parseInt(hex, 16).toString(2).padStart(8, "0")).join("");
    const bits: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
      bits.push(parseInt(bytes.substring(i, i + 1), 2));
    }
    ctx.fillStyle = "#075985";
    const scale = 4;
    // (scale ** 2) * 160 = canvasWidth * canvasHeight
    bits.forEach((bit, index) => {
      if (bit === 1) {
        ctx.fillRect((index % (canvasWidth / scale)) * scale, (index % (canvasHeight / scale)) * scale, scale, scale);
      }
    });
  }, [sha]);

  return (
    <div key={sha} className=" bg-sky-700/20 mb-3 flex">
      <div className="flex-grow p-6 w-0">
        <div className="flex mb-2">
          <div
            className="text-lg cursor-pointer hover:underline duration-200"
            onClick={() => {
              window.open(repository.url, "_blank");
            }}
          >
            {repository.owner.login}
            {`/`}
            {repository.name}
          </div>
          <div className="flex ml-2 overflow-hidden">
            {branches.slice(0, 3).map((branch) => (
              <div
                className="text-sm bg-gray-800/80 py-1 px-2 mr-2 cursor-pointer hover:bg-gray-700/80 duration-200 h-7"
                key={branch.name}
                onClick={() => {
                  window.open(`${repository.url}/tree/${branch.name}`, "_blank");
                }}
              >
                {branch.name}
              </div>
            ))}
            {branches.length > 3 ? <div className="text-gray-300">+</div> : <></>}
          </div>
        </div>
        <div className="font-medium text-xl mb-2 w-auto truncate">{message}</div>
        <div className="flex mb-2 ">
          <AiOutlineFile className="h-auto my-auto " />
          <span className="ml-1">{changedFiles}</span>
          <span className="text-green-600 ml-2">{`+${additions}`}</span>
          <span className="ml-1">/</span>
          <span className="text-red-600 ml-1">{`-${deletions}`}</span>
        </div>
        <div
          className="text-gray-300 text-base cursor-pointer mb-1 hover:underline duration-200"
          onClick={() => {
            window.open(url, "_blank");
          }}
        >
          {sha}
        </div>
        <div className="text-gray-300 text-sm">{dayjs(date).format("YYYY-MM-DD HH:mm:ss")}</div>
      </div>
      <div
        className="flex border-l-2 border-gray-700/50 cursor-pointer"
        onClick={() => {
          window.open(url, "_blank");
        }}
      >
        <div className="my-auto h-auto px-4">
          <canvas ref={canvasRef} width={80} height={128} />
        </div>
      </div>
    </div>
  );
};
