import { cn, format, calculateLevel, calculateTotalXp, calculateXpToNextLevel } from "@/lib/utils";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

describe("cn", () => {
  it("should return an empty string when no arguments are provided", () => {
    expect(cn()).toBe("");
  });

  it("should concatenate class names correctly", () => {
    expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
  });

  it("should handle undefined and null arguments", () => {
    expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
  });

  it("should handle boolean arguments correctly", () => {
    expect(cn("class1", true && "class2", false && "class3")).toBe("class1 class2");
  });

  it("should handle object arguments correctly", () => {
    expect(cn("class1", { class2: true, class3: false, class4: true })).toBe("class1 class2 class4");
  });

  it("should handle array arguments correctly", () => {
    expect(cn("class1", ["class2", "class3"])).toBe("class1 class2 class3");
  });

  it("should handle mixed arguments correctly", () => {
    expect(cn("class1", undefined, { class2: true, class3: false }, ["class4", "class5"])).toBe("class1 class2 class4 class5");
  });
    it('should merge tailwind classes correctly', () => {
    expect(cn('bg-red-500', 'bg-blue-500', 'text-white', 'text-black')).toBe('bg-blue-500 text-black');
  });
});

describe("format", () => {
  it("should format a date correctly", () => {
    const date = new Date(2023, 10, 20);
    expect(format(date)).toBe("Nov 20, 2023");
  });

  it("should handle different date inputs", () => {
    const date = new Date(2024, 0, 1);
    expect(format(date)).toBe("Jan 01, 2024");
  });

  it("should handle invalid dates", () => {
    expect(format(new Date("invalid"))).toBe("Invalid Date");
  });

  it("should format null as Invalid Date", () => {
      expect(format(null as unknown as Date)).toBe("Invalid Date")
  })
  it("should format undefined as Invalid Date", () => {
    expect(format(undefined as unknown as Date)).toBe("Invalid Date")
})
});

describe("calculateLevel", () => {
    it("should return level 1 for 0 xp", () => {
        expect(calculateLevel(0)).toBe(1);
    });

    it("should return level 1 for xp less than 100", () => {
        expect(calculateLevel(50)).toBe(1);
    });

    it("should return level 2 for 100 xp", () => {
        expect(calculateLevel(100)).toBe(2);
    });

    it("should return level 3 for 300 xp", () => {
        expect(calculateLevel(300)).toBe(3);
    });

    it("should return level 4 for 600 xp", () => {
        expect(calculateLevel(600)).toBe(4);
    });

    it("should return level 5 for 1000 xp", () => {
        expect(calculateLevel(1000)).toBe(5);
    });
      it("should return level 10 for 5500 xp", () => {
        expect(calculateLevel(5500)).toBe(11);
    });
      it("should return level 10 for 55000 xp", () => {
        expect(calculateLevel(55000)).toBe(34);
    });
     it("should return level 1 for negative xp", () => {
        expect(calculateLevel(-1)).toBe(1);
    });
});

describe("calculateTotalXp", () => {
    it("should return 0 for level 1", () => {
        expect(calculateTotalXp(1)).toBe(0);
    });

    it("should return 100 for level 2", () => {
        expect(calculateTotalXp(2)).toBe(100);
    });

    it("should return 300 for level 3", () => {
        expect(calculateTotalXp(3)).toBe(300);
    });

    it("should return 600 for level 4", () => {
        expect(calculateTotalXp(4)).toBe(600);
    });

    it("should return 1000 for level 5", () => {
        expect(calculateTotalXp(5)).toBe(1000);
    });

    it("should handle higher levels", () => {
        expect(calculateTotalXp(10)).toBe(4500);
    });
    it("should handle a negative level", () => {
        expect(calculateTotalXp(-1)).toBe(0);
    });

});

describe("calculateXpToNextLevel", () => {
    it("should return 100 for level 1", () => {
        expect(calculateXpToNextLevel(1)).toBe(100);
    });

    it("should return 200 for level 2", () => {
        expect(calculateXpToNextLevel(2)).toBe(200);
    });

    it("should return 300 for level 3", () => {
        expect(calculateXpToNextLevel(3)).toBe(300);
    });

    it("should return 400 for level 4", () => {
        expect(calculateXpToNextLevel(4)).toBe(400);
    });
        it("should return 500 for level 5", () => {
        expect(calculateXpToNextLevel(5)).toBe(500);
    });
    it("should return 1000 for level 10", () => {
        expect(calculateXpToNextLevel(10)).toBe(1000);
    });
    it("should handle negative level", () => {
        expect(calculateXpToNextLevel(-1)).toBe(100);
    });
    it("should handle edge case level 0", () => {
      expect(calculateXpToNextLevel(0)).toBe(100);
    });
});