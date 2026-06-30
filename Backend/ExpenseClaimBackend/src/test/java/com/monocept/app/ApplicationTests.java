package com.monocept.app;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Disabled because it requires a running MySQL database configured in application.properties")
class ApplicationTests {

	@Test
	void contextLoads() {
	}

}
