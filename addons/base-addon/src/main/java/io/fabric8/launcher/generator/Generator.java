package io.fabric8.launcher.generator;

import java.nio.file.Path;

/**
 * @author <a href="mailto:ggastald@redhat.com">George Gastaldi</a>
 */
public interface Generator {
    /**
     * Generate stuff based on some context
     *
     * @param context
     * @return
     */
    void generate(Path projectDir, GeneratorContext context);
}
