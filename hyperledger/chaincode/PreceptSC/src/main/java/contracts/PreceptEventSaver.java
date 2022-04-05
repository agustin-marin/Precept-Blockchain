package contracts;

import com.owlike.genson.Genson;
import com.owlike.genson.GensonBuilder;
import org.hyperledger.fabric.contract.Context;
import org.hyperledger.fabric.contract.ContractInterface;
import org.hyperledger.fabric.contract.annotation.Contract;
import org.hyperledger.fabric.contract.annotation.Default;
import org.hyperledger.fabric.contract.annotation.Info;
import org.hyperledger.fabric.contract.annotation.Transaction;
import org.hyperledger.fabric.protos.peer.ChaincodeShim;
import org.hyperledger.fabric.shim.ChaincodeStub;
import org.hyperledger.fabric.shim.ledger.KeyValue;
import org.hyperledger.fabric.shim.ledger.QueryResultsIterator;
import org.hyperledger.fabric.shim.ledger.QueryResultsIteratorWithMetadata;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;

@Contract(
        name = "",
        info = @Info(
                title = "Save and verify data from IoT sources",
                description = "",
                version = "1.0"
        )
)

@Default
public final class PreceptEventSaver implements ContractInterface {
    // Serializacion JSON
    private final Genson genson = new GensonBuilder().create();//.rename("context","@context").create();
    private static int pageSize = 1;

    /**
     * Push data to the ledger
     *
     * @param data , value to be pushed.
     * @param key  string used to make key = (key + {@link System#nanoTime()})
     */
    @Transaction()
    public String pushData(final Context ctx, final String key, final String data) {
        ChaincodeStub stub = ctx.getStub();

        // Check existence
        /*String publicInformation = stub.getStringState(key);
        if (!publicInformation.isEmpty()) {
            String errorMessage = String.format("PublicInformation %s already exists", key);
            throw new ChaincodeException(errorMessage, "PublicInformation already exists");
        }*/

        long l = System.nanoTime();
        stub.putStringState(key + l, data);

        return new JSONObject().put(key + l, data).toString();
    }

    /**
     * Pull data to the ledger using couchdb query selectors: . {"selector":{"key":"value","key.key":"value"}}
     *
     * @return
     */
    @Transaction()
    public String pullData(final Context ctx, final String query) {
        ChaincodeStub stub = ctx.getStub();
        System.out.println("query: " + query);
        QueryResultsIterator<KeyValue> queryResult = stub.getQueryResult(query);
        HashMap<String, String> results = new HashMap<>();
        //ArrayList<JSONObject> results = new ArrayList<>();


        for (KeyValue keyValue : queryResult) {
            results.put(keyValue.getKey(), new String(keyValue.getValue()));
        }
        return genson.serialize(results);
    }

    /**
     * @param json   json to publish(the entity/event)
     */
    @Transaction()
    public void publicarJson(Context ctx, final String json) {
        ChaincodeStub stub = ctx.getStub();
        JSONObject event = new JSONObject(json);
        stub.putStringState(event.getString("id")+"-"+event.getJSONObject("timestamp").getString("value"),
                json);                                                              // sin procesar, guardo el evento o
                                                                                    // entidad con clave
                                                                                    // id - timestamp.value
    }

    /**
     *devuelve el último valor publicado para el id (timestamp mas alto)
     * @param entityID Id del evento
     * @return
     */
    @Transaction()
    public String getEvent(final Context ctx, final String entityID) {
        long first = System.nanoTime();
        ChaincodeStub stub = ctx.getStub();
        int total = 0;

        JSONObject selectorJSON = new JSONObject();
            selectorJSON.put("entityid", entityID);
            selectorJSON = new JSONObject().put("selector",
                            selectorJSON)
                    .put("use_index", "_design/indexTimedlimitDoc") // index descendente por timestamp solo 1 respuesta
                    .put("limit", 1);

        String s = selectorJSON.toString();
        //HashMap<String, String> results = new HashMap<>();
        JSONArray results = new JSONArray();
        //QueryResultsIterator<KeyValue> result = stub.getQueryResult(s);
        String bookmark = "";
        int fetchedRecordsCount = 0;
        long before;
        before = System.nanoTime();
        System.out.println("SELECTOR: " + s);
        QueryResultsIteratorWithMetadata<KeyValue> queryResultWithPagination = stub.getQueryResultWithPagination(s, pageSize, bookmark);
        long l = (System.nanoTime() - before) / 1_000_000_000;
        System.out.println("TIME TO query with pagination: " + l);

        do {
            l = (System.nanoTime() - first) / 1_000_000_000;
            if (l > 25) { // parar en 25 segundos
                break;
            }

            ChaincodeShim.QueryResponseMetadata metadata = queryResultWithPagination.getMetadata();
            fetchedRecordsCount = metadata.getFetchedRecordsCount();
            for (KeyValue keyValue : queryResultWithPagination) {
                results.put(new JSONObject().put(keyValue.getKey(), new String(keyValue.getValue())));
            }
            queryResultWithPagination = stub.getQueryResultWithPagination(s, pageSize, metadata.getBookmark());
            total += fetchedRecordsCount;
        } while (fetchedRecordsCount > 0);

        long ll = (System.nanoTime() - first) / 1_000_000_000;
        System.out.println("TIME TO query with pagination: " + ll);
        if (ll > 30) {
            System.err.println("Error: TIMEOUT: more than 30 seconds on client, reset.");
        }
        //int seleccion = getpageSize(stub, s);
        return new JSONObject().put("queryResult", results).toString();//.ut(p"count", total).toString();
    }

    private int getpageSize(ChaincodeStub stub, String s) {
        int seleccion = 0;
        double nuevo = -1, anterior = -1;
        for (int i = 1; i < 30; i++) {
            double before = System.nanoTime();
            double count = stub.getQueryResultWithPagination(s, i, "").getMetadata().getFetchedRecordsCount();
            double v = (System.nanoTime() - before);
            nuevo = i / v;
            if (nuevo > anterior) {
                anterior = nuevo;
                seleccion = i;
            }
        }
        System.out.println("SELECCION: " + seleccion);
        return seleccion;
    }
}