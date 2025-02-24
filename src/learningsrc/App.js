function CoreConcept(props) {
    return (
        <li>
            <img src={props.image} alt={"Image comes here"} />
            <h3>Open Trades</h3>
            <p>Click here to view the list of Open trades</p>
        </li>
    )
}

function App() {
    return (
        <div>
            <div className="container">
                <section id='core-concepts'>
                    <h2>My Trading Journal</h2>
                    <ul>
                        <CoreConcept image='./logo192.png' />
                        <CoreConcept image='./logo192.png' />
                        <CoreConcept image='./logo192.png' />
                        <CoreConcept image='./logo192.png' />
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default App;