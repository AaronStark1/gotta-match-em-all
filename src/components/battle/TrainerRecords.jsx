import RecordValue from "../RecordValue";
import "./Battle.css";

const NBSP = " ";

/**
 * The POKéMON command's read-out: best score and time per difficulty plus the
 * Pokédex count, laid out as a compact table that fits the battle text box.
 * `records` comes from readTrainerRecords(). With `skeleton`, every cell is a
 * blank of identical height: an invisible stand-in that reserves the space.
 */
const TrainerRecords = ({ records, skeleton = false }) => {
  const text = (value) => (skeleton ? NBSP : value);

  return (
    <div className="trainer-records">
      <table className="trainer-records__table">
        {!skeleton && <caption className="visually-hidden">Your best records</caption>}
        <thead>
          <tr>
            <th scope="col">{text("Mode")}</th>
            <th scope="col">{text("Score")}</th>
            <th scope="col">{text("Time")}</th>
          </tr>
        </thead>
        <tbody>
          {records.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{text(row.label)}</th>
              <td>{skeleton ? NBSP : <RecordValue value={row.score} placeholder="---" />}</td>
              <td>{skeleton ? NBSP : <RecordValue value={row.time} placeholder="--:--" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="trainer-records__dex">
        <span>{text("POKéDEX")}</span>
        <span>{skeleton ? NBSP : `${records.caught}/${records.dexSize}`}</span>
      </p>
    </div>
  );
};

export default TrainerRecords;
