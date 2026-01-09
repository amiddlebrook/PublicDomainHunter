"""
Patent Monetization Scoring Engine

Calculates comprehensive viability scores for expired patents.
Considers manufacturing complexity, market demand, regulatory barriers,
and competitive landscape.
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import re

logger = logging.getLogger(__name__)


class TechnologyReadinessLevel(Enum):
    """NASA Technology Readiness Levels (TRL)"""
    TRL_1 = 1  # Basic principles observed
    TRL_2 = 2  # Technology concept formulated
    TRL_3 = 3  # Experimental proof of concept
    TRL_4 = 4  # Technology validated in lab
    TRL_5 = 5  # Technology validated in relevant environment
    TRL_6 = 6  # System demonstrated in relevant environment
    TRL_7 = 7  # System prototype demonstrated
    TRL_8 = 8  # System complete and qualified
    TRL_9 = 9  # Actual system proven in operation


class ManufacturingComplexity(Enum):
    """Manufacturing difficulty levels"""
    SIMPLE = "simple"          # Can be made with basic tools
    MODERATE = "moderate"      # Requires some specialized equipment
    COMPLEX = "complex"        # Requires significant tooling investment
    EXPERT = "expert"          # Requires advanced facilities/expertise


class RegulatoryCategory(Enum):
    """Regulatory approval categories"""
    NONE = "none"              # No special approval needed
    MINIMAL = "minimal"        # Simple certifications (UL, CE)
    MODERATE = "moderate"      # Industry-specific (FCC, EPA)
    EXTENSIVE = "extensive"    # Major approval (FDA, FAA)


@dataclass
class PatentMonetizationScore:
    """Comprehensive patent monetization analysis"""
    patent_number: str

    # Core scores (0-100)
    overall_score: float = 0.0
    manufacturing_viability: float = 0.0
    market_demand: float = 0.0
    competitive_advantage: float = 0.0
    implementation_readiness: float = 0.0

    # Manufacturing factors
    manufacturing_complexity: ManufacturingComplexity = ManufacturingComplexity.MODERATE
    tooling_requirements: str = ""
    component_availability: float = 0.0
    estimated_unit_cost: Optional[str] = None
    minimum_order_quantity: Optional[int] = None

    # Market factors
    market_size_estimate: str = ""
    target_industries: List[str] = field(default_factory=list)
    search_volume_signal: float = 0.0
    competition_level: str = ""

    # Technical factors
    technology_readiness_level: TechnologyReadinessLevel = TechnologyReadinessLevel.TRL_6
    dependent_patents: int = 0
    improvement_patents: int = 0
    standards_relevance: bool = False

    # Regulatory factors
    regulatory_category: RegulatoryCategory = RegulatoryCategory.NONE
    estimated_approval_timeline: str = ""
    certification_requirements: List[str] = field(default_factory=list)

    # Commercial pathways
    licensing_potential: float = 0.0
    direct_manufacturing_score: float = 0.0
    service_business_score: float = 0.0
    educational_content_score: float = 0.0

    # Risk assessment
    risk_factors: List[str] = field(default_factory=list)
    opportunity_factors: List[str] = field(default_factory=list)

    # Recommendations
    recommended_approach: str = ""
    first_steps: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "patent_number": self.patent_number,
            "overall_score": self.overall_score,
            "scores": {
                "manufacturing_viability": self.manufacturing_viability,
                "market_demand": self.market_demand,
                "competitive_advantage": self.competitive_advantage,
                "implementation_readiness": self.implementation_readiness,
            },
            "manufacturing": {
                "complexity": self.manufacturing_complexity.value,
                "tooling_requirements": self.tooling_requirements,
                "component_availability": self.component_availability,
                "estimated_unit_cost": self.estimated_unit_cost,
            },
            "market": {
                "size_estimate": self.market_size_estimate,
                "target_industries": self.target_industries,
                "search_volume_signal": self.search_volume_signal,
                "competition_level": self.competition_level,
            },
            "technical": {
                "trl": self.technology_readiness_level.value,
                "dependent_patents": self.dependent_patents,
                "improvement_patents": self.improvement_patents,
                "standards_relevance": self.standards_relevance,
            },
            "regulatory": {
                "category": self.regulatory_category.value,
                "approval_timeline": self.estimated_approval_timeline,
                "certifications": self.certification_requirements,
            },
            "pathways": {
                "licensing": self.licensing_potential,
                "direct_manufacturing": self.direct_manufacturing_score,
                "service_business": self.service_business_score,
                "educational": self.educational_content_score,
            },
            "assessment": {
                "risks": self.risk_factors,
                "opportunities": self.opportunity_factors,
                "recommended_approach": self.recommended_approach,
                "first_steps": self.first_steps,
            },
        }


class PatentScoringEngine:
    """
    Engine for calculating patent monetization potential.

    Uses heuristics and pattern matching to analyze:
    - Patent title and abstract
    - CPC classification codes
    - Claims structure
    - Citation patterns
    """

    # CPC codes that typically indicate simpler manufacturing
    SIMPLE_MANUFACTURING_CPC = [
        "A47",  # Furniture, household
        "B42",  # Bookbinding
        "B43",  # Writing implements
        "B65",  # Packaging
        "D06",  # Fabrics treatment
    ]

    # CPC codes that indicate complex manufacturing
    COMPLEX_MANUFACTURING_CPC = [
        "H01L",  # Semiconductors
        "G02",   # Optics
        "C12",   # Biochemistry
        "B64",   # Aircraft
        "F02",   # Combustion engines
    ]

    # CPC codes requiring regulatory approval
    REGULATED_CPC = {
        "A61": RegulatoryCategory.EXTENSIVE,  # Medical
        "A62": RegulatoryCategory.MODERATE,   # Fire protection
        "B60": RegulatoryCategory.MODERATE,   # Vehicles
        "B64": RegulatoryCategory.EXTENSIVE,  # Aircraft
        "G01N": RegulatoryCategory.MODERATE,  # Testing
        "H04": RegulatoryCategory.MODERATE,   # Telecom
    }

    # Keywords indicating high market demand
    HIGH_DEMAND_KEYWORDS = [
        "solar", "battery", "renewable", "electric", "wireless",
        "smart", "IoT", "sensor", "LED", "sustainable",
        "recycling", "water purification", "air filter",
        "3d print", "drone", "robot", "automation",
    ]

    # Keywords indicating niche/specialized markets
    NICHE_KEYWORDS = [
        "specialized", "industrial", "laboratory", "scientific",
        "military", "aerospace", "nuclear", "submarine",
    ]

    def __init__(self):
        pass

    async def calculate_score(
        self,
        patent_number: str,
        title: str,
        abstract: Optional[str] = None,
        cpc_codes: Optional[List[str]] = None,
        claims_count: int = 0,
        cited_by_count: int = 0,
        grant_date: Optional[str] = None,
    ) -> PatentMonetizationScore:
        """
        Calculate comprehensive monetization score for a patent.
        """
        score = PatentMonetizationScore(patent_number=patent_number)

        # Combine text for analysis
        text = f"{title} {abstract or ''}".lower()
        cpc_codes = cpc_codes or []

        # Calculate individual components
        score.manufacturing_complexity = self._assess_manufacturing_complexity(text, cpc_codes)
        score.component_availability = self._assess_component_availability(text, cpc_codes)
        score.manufacturing_viability = self._calculate_manufacturing_viability(score)

        score.search_volume_signal = self._assess_market_demand(text)
        score.target_industries = self._identify_target_industries(text, cpc_codes)
        score.market_size_estimate = self._estimate_market_size(text, cpc_codes)
        score.market_demand = self._calculate_market_score(score)

        score.regulatory_category = self._assess_regulatory_requirements(cpc_codes)
        score.certification_requirements = self._get_certifications(score.regulatory_category)
        score.estimated_approval_timeline = self._estimate_approval_timeline(score.regulatory_category)

        score.technology_readiness_level = self._assess_trl(text, claims_count)
        score.implementation_readiness = self._calculate_implementation_readiness(score)

        score.competitive_advantage = self._assess_competitive_advantage(cited_by_count, claims_count)

        # Calculate pathway scores
        score.licensing_potential = self._calculate_licensing_potential(score)
        score.direct_manufacturing_score = self._calculate_direct_manufacturing(score)
        score.service_business_score = self._calculate_service_potential(text)
        score.educational_content_score = self._calculate_educational_potential(text, claims_count)

        # Calculate overall score
        score.overall_score = self._calculate_overall_score(score)

        # Generate recommendations
        score.risk_factors = self._identify_risks(score, text)
        score.opportunity_factors = self._identify_opportunities(score, text)
        score.recommended_approach = self._recommend_approach(score)
        score.first_steps = self._generate_first_steps(score)

        return score

    def _assess_manufacturing_complexity(
        self,
        text: str,
        cpc_codes: List[str]
    ) -> ManufacturingComplexity:
        """Assess manufacturing difficulty based on patent characteristics."""
        # Check CPC codes
        for code in cpc_codes:
            code_prefix = code[:3] if len(code) >= 3 else code

            if any(code.startswith(simple) for simple in self.SIMPLE_MANUFACTURING_CPC):
                return ManufacturingComplexity.SIMPLE

            if any(code.startswith(complex_code) for complex_code in self.COMPLEX_MANUFACTURING_CPC):
                return ManufacturingComplexity.EXPERT

        # Check text for complexity indicators
        simple_indicators = ["simple", "basic", "hand tool", "manual", "wooden", "plastic"]
        complex_indicators = ["precision", "nanometer", "semiconductor", "circuit", "laser", "vacuum"]

        if any(ind in text for ind in complex_indicators):
            return ManufacturingComplexity.COMPLEX

        if any(ind in text for ind in simple_indicators):
            return ManufacturingComplexity.SIMPLE

        return ManufacturingComplexity.MODERATE

    def _assess_component_availability(self, text: str, cpc_codes: List[str]) -> float:
        """Score component availability (0-100)."""
        # Standard materials = high availability
        standard_materials = ["steel", "aluminum", "plastic", "rubber", "glass", "wood"]
        # Specialized materials = lower availability
        specialized_materials = ["titanium", "rare earth", "germanium", "gallium", "graphene"]

        score = 70  # Base score

        for material in standard_materials:
            if material in text:
                score += 5

        for material in specialized_materials:
            if material in text:
                score -= 10

        return max(0, min(100, score))

    def _calculate_manufacturing_viability(self, score: PatentMonetizationScore) -> float:
        """Calculate overall manufacturing viability score."""
        complexity_scores = {
            ManufacturingComplexity.SIMPLE: 90,
            ManufacturingComplexity.MODERATE: 70,
            ManufacturingComplexity.COMPLEX: 45,
            ManufacturingComplexity.EXPERT: 25,
        }

        base = complexity_scores.get(score.manufacturing_complexity, 50)
        component_factor = score.component_availability / 100

        return base * 0.6 + (component_factor * 100) * 0.4

    def _assess_market_demand(self, text: str) -> float:
        """Assess market demand based on keywords and trends."""
        score = 50  # Base score

        for keyword in self.HIGH_DEMAND_KEYWORDS:
            if keyword in text:
                score += 8

        for keyword in self.NICHE_KEYWORDS:
            if keyword in text:
                score -= 5

        return max(0, min(100, score))

    def _identify_target_industries(self, text: str, cpc_codes: List[str]) -> List[str]:
        """Identify target industries from patent content."""
        industries = []

        industry_keywords = {
            "Consumer Electronics": ["phone", "tablet", "computer", "display", "audio"],
            "Healthcare": ["medical", "health", "patient", "hospital", "diagnostic"],
            "Automotive": ["vehicle", "car", "automotive", "engine", "brake"],
            "Agriculture": ["farm", "crop", "agricultural", "harvest", "irrigation"],
            "Energy": ["solar", "wind", "battery", "power", "energy"],
            "Manufacturing": ["machine", "tool", "manufacturing", "production"],
            "Construction": ["building", "construction", "concrete", "structure"],
            "Food & Beverage": ["food", "beverage", "cooking", "brewing", "packaging"],
        }

        for industry, keywords in industry_keywords.items():
            if any(kw in text for kw in keywords):
                industries.append(industry)

        return industries[:4]  # Top 4

    def _estimate_market_size(self, text: str, cpc_codes: List[str]) -> str:
        """Rough market size estimation."""
        # This would ideally connect to market data APIs
        if any(kw in text for kw in ["consumer", "home", "personal"]):
            return "$10B+ (Consumer market)"
        elif any(kw in text for kw in ["industrial", "manufacturing"]):
            return "$5-10B (Industrial market)"
        elif any(kw in text for kw in ["specialized", "laboratory"]):
            return "$100M-1B (Specialized market)"
        return "$1-5B (General market)"

    def _calculate_market_score(self, score: PatentMonetizationScore) -> float:
        """Calculate market demand score."""
        base = score.search_volume_signal
        industry_bonus = len(score.target_industries) * 5
        return min(100, base + industry_bonus)

    def _assess_regulatory_requirements(self, cpc_codes: List[str]) -> RegulatoryCategory:
        """Assess regulatory approval requirements."""
        for code in cpc_codes:
            for prefix, category in self.REGULATED_CPC.items():
                if code.startswith(prefix):
                    return category
        return RegulatoryCategory.NONE

    def _get_certifications(self, category: RegulatoryCategory) -> List[str]:
        """Get likely certification requirements."""
        certs = {
            RegulatoryCategory.NONE: [],
            RegulatoryCategory.MINIMAL: ["UL", "CE", "FCC (if electronic)"],
            RegulatoryCategory.MODERATE: ["UL", "CE", "FCC", "EPA", "Industry-specific"],
            RegulatoryCategory.EXTENSIVE: ["FDA", "FAA", "Full regulatory review"],
        }
        return certs.get(category, [])

    def _estimate_approval_timeline(self, category: RegulatoryCategory) -> str:
        """Estimate regulatory approval timeline."""
        timelines = {
            RegulatoryCategory.NONE: "None required",
            RegulatoryCategory.MINIMAL: "1-3 months",
            RegulatoryCategory.MODERATE: "3-12 months",
            RegulatoryCategory.EXTENSIVE: "1-5 years",
        }
        return timelines.get(category, "Unknown")

    def _assess_trl(self, text: str, claims_count: int) -> TechnologyReadinessLevel:
        """Assess Technology Readiness Level."""
        # Granted patents are typically TRL 4-6
        if claims_count > 20:
            return TechnologyReadinessLevel.TRL_6
        elif claims_count > 10:
            return TechnologyReadinessLevel.TRL_5
        else:
            return TechnologyReadinessLevel.TRL_4

    def _calculate_implementation_readiness(self, score: PatentMonetizationScore) -> float:
        """Calculate implementation readiness score."""
        trl_score = score.technology_readiness_level.value * 10
        regulatory_penalty = {
            RegulatoryCategory.NONE: 0,
            RegulatoryCategory.MINIMAL: 5,
            RegulatoryCategory.MODERATE: 15,
            RegulatoryCategory.EXTENSIVE: 35,
        }.get(score.regulatory_category, 0)

        return max(0, min(100, trl_score - regulatory_penalty + 20))

    def _assess_competitive_advantage(self, cited_by_count: int, claims_count: int) -> float:
        """Assess competitive advantage potential."""
        # More citations = more important/foundational patent
        citation_score = min(50, cited_by_count * 2)
        # More claims = broader protection (historically)
        claims_score = min(50, claims_count * 2)
        return citation_score + claims_score

    def _calculate_licensing_potential(self, score: PatentMonetizationScore) -> float:
        """Calculate licensing potential score."""
        base = score.competitive_advantage * 0.4
        market_factor = score.market_demand * 0.3
        complexity_bonus = 30 if score.manufacturing_complexity in [
            ManufacturingComplexity.COMPLEX,
            ManufacturingComplexity.EXPERT
        ] else 0
        return min(100, base + market_factor + complexity_bonus)

    def _calculate_direct_manufacturing(self, score: PatentMonetizationScore) -> float:
        """Calculate direct manufacturing viability."""
        return score.manufacturing_viability * 0.5 + score.market_demand * 0.3 + score.implementation_readiness * 0.2

    def _calculate_service_potential(self, text: str) -> float:
        """Calculate service business potential."""
        service_keywords = ["method", "process", "system", "service", "treatment", "analysis"]
        score = 30
        for kw in service_keywords:
            if kw in text:
                score += 10
        return min(100, score)

    def _calculate_educational_potential(self, text: str, claims_count: int) -> float:
        """Calculate educational content potential."""
        # Complex patents with many claims = good teaching material
        base = min(50, claims_count * 3)
        technical_keywords = ["principle", "mechanism", "method", "apparatus", "system"]
        for kw in technical_keywords:
            if kw in text:
                base += 10
        return min(100, base)

    def _calculate_overall_score(self, score: PatentMonetizationScore) -> float:
        """Calculate weighted overall score."""
        weights = {
            'manufacturing': 0.25,
            'market': 0.30,
            'competitive': 0.20,
            'implementation': 0.25,
        }

        overall = (
            score.manufacturing_viability * weights['manufacturing'] +
            score.market_demand * weights['market'] +
            score.competitive_advantage * weights['competitive'] +
            score.implementation_readiness * weights['implementation']
        )

        return round(overall, 1)

    def _identify_risks(self, score: PatentMonetizationScore, text: str) -> List[str]:
        """Identify key risks."""
        risks = []

        if score.manufacturing_complexity in [ManufacturingComplexity.COMPLEX, ManufacturingComplexity.EXPERT]:
            risks.append("High manufacturing complexity requires specialized facilities")

        if score.regulatory_category == RegulatoryCategory.EXTENSIVE:
            risks.append("Extensive regulatory approval required (FDA, FAA, etc.)")

        if score.component_availability < 50:
            risks.append("Some components may be difficult to source")

        if score.improvement_patents > 5:
            risks.append("Multiple improvement patents may limit freedom to operate")

        if "specialized" in text or "precision" in text:
            risks.append("May require specialized expertise to implement")

        return risks[:5]

    def _identify_opportunities(self, score: PatentMonetizationScore, text: str) -> List[str]:
        """Identify key opportunities."""
        opportunities = []

        if score.market_demand > 70:
            opportunities.append("High market demand indicates strong commercial potential")

        if score.manufacturing_complexity == ManufacturingComplexity.SIMPLE:
            opportunities.append("Simple manufacturing enables rapid market entry")

        if score.competitive_advantage > 60:
            opportunities.append("Strong patent with significant citations indicates foundational technology")

        if len(score.target_industries) >= 3:
            opportunities.append("Cross-industry applicability creates multiple revenue streams")

        if score.licensing_potential > 70:
            opportunities.append("High licensing potential for passive income")

        if any(kw in text for kw in self.HIGH_DEMAND_KEYWORDS):
            opportunities.append("Aligns with current technology trends")

        return opportunities[:5]

    def _recommend_approach(self, score: PatentMonetizationScore) -> str:
        """Generate recommended commercialization approach."""
        if score.licensing_potential > score.direct_manufacturing_score:
            return "LICENSING: Consider licensing to established manufacturers who can scale production efficiently."

        if score.manufacturing_complexity == ManufacturingComplexity.SIMPLE and score.market_demand > 60:
            return "DIRECT MANUFACTURING: Low complexity and good demand make direct production attractive."

        if score.service_business_score > 70:
            return "SERVICE BUSINESS: The patent describes methods well-suited for service-based monetization."

        if score.educational_content_score > 70:
            return "EDUCATIONAL: Create courses, books, or consulting services around this technology."

        return "HYBRID: Consider a combination of licensing and selective direct implementation."

    def _generate_first_steps(self, score: PatentMonetizationScore) -> List[str]:
        """Generate actionable first steps."""
        steps = [
            "Review full patent claims and identify core innovation",
            "Search for improvement patents that may affect freedom to operate",
        ]

        if score.manufacturing_complexity != ManufacturingComplexity.EXPERT:
            steps.append("Get manufacturing quotes from contract manufacturers")

        if score.regulatory_category != RegulatoryCategory.NONE:
            steps.append(f"Consult regulatory expert for {score.regulatory_category.value} approval pathway")

        if score.market_demand > 50:
            steps.append("Conduct market validation with potential customers")

        if score.licensing_potential > 60:
            steps.append("Identify potential licensees in target industries")

        return steps[:5]


# Convenience function
async def score_patent(
    patent_number: str,
    title: str,
    abstract: Optional[str] = None,
    cpc_codes: Optional[List[str]] = None,
    claims_count: int = 0,
    cited_by_count: int = 0,
) -> Dict[str, Any]:
    """Quick function to score a patent."""
    engine = PatentScoringEngine()
    score = await engine.calculate_score(
        patent_number=patent_number,
        title=title,
        abstract=abstract,
        cpc_codes=cpc_codes,
        claims_count=claims_count,
        cited_by_count=cited_by_count,
    )
    return score.to_dict()
