package io.fabric8.launcher.generator;

import java.nio.file.Path;
import java.util.Map;

/**
 * @author <a href="mailto:ggastald@redhat.com">George Gastaldi</a>
 */
public interface Capability {
    void generate(Path projectRoot, Map<String, String> context);
}
