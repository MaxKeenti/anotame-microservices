package com.anotame.identity;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;

@QuarkusMain
public class IdentityServiceApplication {

	public static void main(String[] args) {
		Quarkus.run(args);
	}
}
