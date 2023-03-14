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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
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
    private static int pageSize = 2;

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
     * @param json json to publish(the entity/event)
     */
    @Transaction()
    public void publicarJson(Context ctx, final String json) {
        ChaincodeStub stub = ctx.getStub();
        JSONObject event = new JSONObject(json);
        JSONObject timestamp;
        try {
                timestamp = event.getJSONObject("timestamp");
                System.out.println("timestamp: "+ timestamp.toString());
        } catch (Exception e) {
                timestamp = event.getJSONObject("TimeInstant");
                System.out.println("timeinstant: "+ timestamp.toString());
                event = event.put("timestamp", timestamp);
                System.out.println("event: "+ event.toString());
        }
        stub.putStringState(event.getString("id") + "-" + timestamp.getString("value"),
                event.toString());                                                              // sin procesar, guardo el evento o
        // entidad con clave
        // id - timestamp.value
    }

    /**
     * devuelve el último valor publicado para el id (timestamp mas alto)
     *
     * @param entityID Id del evento
     * @return
     */
    @Transaction()
    public String getEvent(final Context ctx, final String entityID) {
        long first = System.nanoTime();
        ChaincodeStub stub = ctx.getStub();
        int total = 0;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yearpls1 = LocalDateTime.of(now.getYear() + 1, now.getMonth(), now.getDayOfMonth(), now.getHour(), now.getMinute());
        JSONObject selectorJSON = new JSONObject();
        selectorJSON.put("id", entityID).put("timestamp.value", new JSONObject().put("$lt", dtf.format(yearpls1)));
        selectorJSON = new JSONObject().put("selector",
                        selectorJSON)
                .put("use_index", "_design/indexTimedlimitDoc") // index descendente por timestamp solo 1 respuesta
                .put("limit", 1);
               // .put("sort", List.of(new JSONObject().put("timestamp.value", "desc")));
        String s = selectorJSON.toString();
        //HashMap<String, String> results = new HashMap<>();
        JSONObject results = new JSONObject();
        //QueryResultsIterator<KeyValue> result = stub.getQueryResult(s);
        String bookmark = "";
        int fetchedRecordsCount = 0;
        long before;
        before = System.nanoTime();
        System.out.println("SELECTOR: " + s);
        QueryResultsIteratorWithMetadata<KeyValue> queryResultWithPagination = stub.getQueryResultWithPagination(s, pageSize, bookmark);
        long l = (System.nanoTime() - before) / 1_000_000_000;
        System.out.println("TIME TO query with pagination: " + l);
        if (queryResultWithPagination.getMetadata().getFetchedRecordsCount() > 0)
            do {
                l = (System.nanoTime() - first) / 1_000_000_000;
                if (l > 25) { // parar en 25 segundos
                    break;
                }

                ChaincodeShim.QueryResponseMetadata metadata = queryResultWithPagination.getMetadata();
                fetchedRecordsCount = metadata.getFetchedRecordsCount();
                bookmark = metadata.getBookmark();
                for (KeyValue keyValue : queryResultWithPagination) {
                    System.out.println("PAGINATION REULST: " + new String(keyValue.getValue()));
                    results = new JSONObject(new String(keyValue.getValue()));
                }
                queryResultWithPagination = stub.getQueryResultWithPagination(s, pageSize, bookmark);
                total += fetchedRecordsCount;
            } while (fetchedRecordsCount > 0);

        long ll = (System.nanoTime() - first) / 1_000_000_000;
        System.out.println("TIME TO query with pagination: " + ll);
        if (ll > 30) {
            System.err.println("Error: TIMEOUT: more than 30 seconds on client, reset.");
        }
        //int seleccion = getpageSize(stub, s);
        System.out.println("RESPONSE: " + new JSONObject().put("queryResult", results).toString());
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
