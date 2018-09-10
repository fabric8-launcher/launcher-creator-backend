package io.fabric8.launcher.generator;

import java.nio.file.Path;
import java.util.List;

/**
 * @author <a href="mailto:ggastald@redhat.com">George Gastaldi</a>
 */
public class CompositeGenerator implements Generator {

    private final List<Generator> generators;

    public CompositeGenerator(List<Generator> generators) {
        this.generators = generators;
    }

    @Override
    public void generate(Path projectDir, GeneratorContext context) {
        generators.forEach(generator -> generator.generate(projectDir, context));
    }
}
