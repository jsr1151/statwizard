import Card from '../analysis/AnalysisCard.jsx';
import TableDataSourceFields from '../analysis/TableDataSourceFields.jsx';
export default function PearsonDataSourceCard(props) {
    return <Card darkMode={props.darkMode}><TableDataSourceFields {...props} sampleLabel="Load example data" /></Card>;
}
