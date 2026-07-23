package com.anotame.observability.runtime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.lang.management.BufferPoolMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryPoolMXBean;
import java.lang.management.MemoryUsage;
import java.util.List;

@ApplicationScoped
public class RuntimeStartupReporter {

    private static final Logger TELEMETRY_LOG = Logger.getLogger("anotame.runtime.telemetry");
    private static final Logger LOG = Logger.getLogger(RuntimeStartupReporter.class);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "quarkus.application.name")
    String applicationName;

    @ConfigProperty(name = "RAILWAY_SERVICE_NAME", defaultValue = "")
    String railwayServiceName;

    @ConfigProperty(name = "RAILWAY_ENVIRONMENT_NAME", defaultValue = "local")
    String environment;

    @ConfigProperty(name = "RAILWAY_DEPLOYMENT_ID", defaultValue = "local")
    String deploymentId;

    void onStart(@Observes StartupEvent ignored) {
        try {
            TELEMETRY_LOG.info(objectMapper.writeValueAsString(snapshot()));
        } catch (JsonProcessingException exception) {
            LOG.warn("Unable to serialize runtime limits event", exception);
        }
    }

    RuntimeLimitsEvent snapshot() {
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        MemoryUsage metaspace = ManagementFactory.getMemoryPoolMXBeans().stream()
                .filter(pool -> "Metaspace".equals(pool.getName()))
                .findFirst()
                .map(MemoryPoolMXBean::getUsage)
                .orElse(new MemoryUsage(0, 0, 0, -1));

        long directBufferUsed = ManagementFactory.getPlatformMXBeans(BufferPoolMXBean.class).stream()
                .filter(pool -> "direct".equals(pool.getName()))
                .mapToLong(BufferPoolMXBean::getMemoryUsed)
                .sum();
        long directBufferCapacity = ManagementFactory.getPlatformMXBeans(BufferPoolMXBean.class).stream()
                .filter(pool -> "direct".equals(pool.getName()))
                .mapToLong(BufferPoolMXBean::getTotalCapacity)
                .sum();

        List<String> memoryOptions = ManagementFactory.getRuntimeMXBean().getInputArguments().stream()
                .filter(RuntimeStartupReporter::isSafeMemoryOption)
                .sorted()
                .toList();
        List<String> garbageCollectors = ManagementFactory.getGarbageCollectorMXBeans().stream()
                .map(bean -> bean.getName())
                .sorted()
                .toList();

        return new RuntimeLimitsEvent(
                "runtime_limits",
                serviceName(),
                environment,
                deploymentId,
                heap.getInit(),
                heap.getCommitted(),
                heap.getMax(),
                metaspace.getInit(),
                metaspace.getCommitted(),
                metaspace.getMax(),
                directBufferUsed,
                directBufferCapacity,
                ManagementFactory.getThreadMXBean().getThreadCount(),
                Runtime.getRuntime().availableProcessors(),
                ManagementFactory.getRuntimeMXBean().getUptime(),
                System.getProperty("java.version"),
                garbageCollectors,
                memoryOptions);
    }

    private String serviceName() {
        return railwayServiceName == null || railwayServiceName.isBlank()
                ? applicationName
                : railwayServiceName;
    }

    private static boolean isSafeMemoryOption(String option) {
        return option.startsWith("-Xms")
                || option.startsWith("-Xmx")
                || option.startsWith("-Xss")
                || option.startsWith("-XX:MaxMetaspaceSize=")
                || option.startsWith("-XX:ActiveProcessorCount=")
                || option.equals("-XX:+UseSerialGC")
                || option.equals("-XX:+ExitOnOutOfMemoryError");
    }

    record RuntimeLimitsEvent(
            String event,
            String service,
            String environment,
            @JsonProperty("deployment_id") String deploymentId,
            @JsonProperty("heap_initial_bytes") long heapInitialBytes,
            @JsonProperty("heap_committed_bytes") long heapCommittedBytes,
            @JsonProperty("heap_max_bytes") long heapMaxBytes,
            @JsonProperty("metaspace_initial_bytes") long metaspaceInitialBytes,
            @JsonProperty("metaspace_committed_bytes") long metaspaceCommittedBytes,
            @JsonProperty("metaspace_max_bytes") long metaspaceMaxBytes,
            @JsonProperty("direct_buffer_used_bytes") long directBufferUsedBytes,
            @JsonProperty("direct_buffer_capacity_bytes") long directBufferCapacityBytes,
            @JsonProperty("thread_count") int threadCount,
            @JsonProperty("available_processors") int availableProcessors,
            @JsonProperty("jvm_uptime_ms") long jvmUptimeMs,
            @JsonProperty("java_version") String javaVersion,
            @JsonProperty("garbage_collectors") List<String> garbageCollectors,
            @JsonProperty("jvm_memory_options") List<String> jvmMemoryOptions) {
    }
}
