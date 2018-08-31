package io.fabric8.launcher.generator;

import io.fabric8.launcher.generator.handlers.ScriptHandler;
import io.fabric8.launcher.generator.verticles.FurnaceVerticle;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.MessageConsumer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import org.jboss.forge.addon.script.ScriptOperations;
import org.jboss.forge.furnace.Furnace;

/**
 * @author <a href="mailto:ggastald@redhat.com">George Gastaldi</a>
 */
public class Main {

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        vertx.deployVerticle(FurnaceVerticle.class.getName());
        Router router = Router.router(vertx);
        // enable parsing of request bodies
        router.route().handler(BodyHandler.create());
        ScriptOperations scriptOperations = FurnaceVerticle.furnace.getAddonRegistry().getServices(ScriptOperations.class).get();
        router.post("/api/forge/zip").blockingHandler(new ScriptHandler(scriptOperations));

        vertx.createHttpServer()
                .requestHandler(router::accept)
                .listen(8080);
        System.out.println("Started!!");
    }


}

