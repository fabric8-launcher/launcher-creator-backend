package io.fabric8.launcher.generator.handlers;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import io.fabric8.launcher.generator.util.Zip;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpHeaders;
import io.vertx.ext.web.RoutingContext;
import org.jboss.forge.addon.script.ScriptOperations;

/**
 * @author <a href="mailto:ggastald@redhat.com">George Gastaldi</a>
 */
public class ScriptHandler implements Handler<RoutingContext> {

    private ScriptOperations scriptOperations;

    public ScriptHandler(ScriptOperations scriptOperations) {
        this.scriptOperations = scriptOperations;
    }

    @Override
    public void handle(RoutingContext routingContext) {
        String body = routingContext.getBodyAsString();
        try {
            Path tempDirectory = Files.createTempDirectory("tmp");
            scriptOperations.evaluate(tempDirectory.toFile(), body, 1000, null, null);
            System.out.println("### TEMP DIR: " + tempDirectory);
            Path tempFile = Files.createTempFile("project", ".zip");
            try (OutputStream os = Files.newOutputStream(tempFile)) {
                Zip.zip(null, tempDirectory, os);
            }
            // Send the ZIP in the response
            routingContext.response()
                    .putHeader(HttpHeaders.CONTENT_TYPE, "application/zip")
                    .putHeader("Content-Disposition", "attachment; filename=generated.zip")
                    .sendFile(tempFile.toString());
        } catch (Exception e) {
            e.printStackTrace();
            routingContext.response().setStatusCode(500).end(e.getMessage());
        }
    }
}
