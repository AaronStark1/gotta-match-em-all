/**
 * A best-score / best-time readout. With no record yet (`value` null or
 * undefined) it shows the arcade placeholder ("---" / "--:--") on screen
 * but gives screen readers real words instead of "dash dash dash".
 */
const RecordValue = ({ value, placeholder }) =>
  value === null || value === undefined ? (
    <>
      <span aria-hidden="true">{placeholder}</span>
      <span className="visually-hidden">No record yet</span>
    </>
  ) : (
    value
  );

export default RecordValue;
