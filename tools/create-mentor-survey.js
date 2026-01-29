// ============================================
// 커피챗 멘토 니즈 파악 설문 - Google Forms 자동 생성 스크립트
// ============================================
// 사용법:
// 1. https://script.google.com 접속
// 2. "새 프로젝트" 클릭
// 3. 이 코드 전체를 복사해서 붙여넣기
// 4. ▶ 실행 버튼 클릭 (함수: createMentorSurvey)
// 5. Google 권한 허용
// 6. 로그에 출력된 폼 URL 확인
// ============================================

function createMentorSurvey() {
  const form = FormApp.create("☕ 커피챗 멘토 설문조사");
  form.setDescription(
    "안녕하세요! 게임업계 현직자와 주니어를 연결하는 커피챗입니다.\n\n" +
    "멘토로 활동해주실 현직자분들의 니즈를 파악하기 위한 설문이에요.\n" +
    "약 3~5분 정도 소요됩니다. 솔직하게 답변해주시면 큰 도움이 됩니다!\n\n" +
    "응답 내용은 서비스 기획 목적으로만 사용되며, 개인정보는 수집하지 않습니다."
  );
  form.setConfirmationMessage("소중한 답변 감사합니다! 🙏\n커피챗이 더 좋은 멘토링 환경을 만들어갈게요.");
  form.setIsQuiz(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);

  // ─── 섹션 1: 기본 정보 ───
  form.addSectionHeaderItem()
    .setTitle("📋 기본 정보")
    .setHelpText("현재 직무에 대해 알려주세요.");

  // Q1. 직군
  form.addMultipleChoiceItem()
    .setTitle("1. 현재 직군을 알려주세요")
    .setChoiceValues([
      "기획 (게임 디자인/레벨 디자인/시스템 기획 등)",
      "프로그래밍 (클라이언트/서버/엔진 등)",
      "아트 (원화/3D/UI/이펙트 등)",
      "QA",
      "PM / PO",
      "사업 / 마케팅 / 퍼블리싱",
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Q2. 경력
  form.addMultipleChoiceItem()
    .setTitle("2. 경력 연차를 알려주세요")
    .setChoiceValues([
      "3~5년",
      "5~8년",
      "8~12년",
      "12년 이상",
    ])
    .setRequired(true);

  // Q3. 회사 규모
  form.addMultipleChoiceItem()
    .setTitle("3. 현재 재직 중인 회사 규모는?")
    .setChoiceValues([
      "대기업 (넥슨/넷마블/크래프톤/엔씨 등)",
      "중견 (100인 이상)",
      "중소 / 스타트업",
      "프리랜서 / 1인 개발",
    ])
    .setRequired(true);

  // ─── 섹션 2: 멘토링 경험과 관심도 ───
  form.addSectionHeaderItem()
    .setTitle("💬 멘토링 경험과 관심도")
    .setHelpText("멘토링에 대한 경험과 생각을 알려주세요.");

  // Q4. 조언 경험
  form.addMultipleChoiceItem()
    .setTitle("4. 후배나 동료에게 커리어 조언을 해본 경험이 있나요?")
    .setChoiceValues([
      "자주 있다 (월 1회 이상)",
      "가끔 있다 (분기 1~2회)",
      "거의 없다",
    ])
    .setRequired(true);

  // Q5. 멘토 활동 의향 (분기 기준)
  var interestItem = form.addMultipleChoiceItem()
    .setTitle("5. 멘토링 플랫폼에서 멘토로 활동할 의향이 있나요?")
    .setRequired(true);

  // 분기용 페이지 생성
  var exitPage = form.addPageBreakItem()
    .setTitle("의견 감사합니다");

  // Q6. 관심 없는 이유
  form.addParagraphTextItem()
    .setTitle("6. 관심이 없는 이유가 있다면 알려주세요")
    .setHelpText("솔직한 의견이 서비스 개선에 큰 도움이 됩니다.")
    .setRequired(false);

  // 종료 페이지로 이동 설정
  exitPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  // 멘토링 분야 페이지
  var continuePage = form.addPageBreakItem()
    .setTitle("🎯 멘토링 가능 분야");

  continuePage.setHelpText("어떤 분야에서 도움을 줄 수 있는지 알려주세요.");

  // Q5 분기 설정
  interestItem.setChoices([
    interestItem.createChoice("적극적으로 하고 싶다", continuePage),
    interestItem.createChoice("조건이 맞으면 해볼 수 있다", continuePage),
    interestItem.createChoice("아직 잘 모르겠다", continuePage),
    interestItem.createChoice("관심 없다", exitPage),
  ]);

  // ─── 섹션 3: 멘토링 가능 분야 ───
  // (페이지 브레이크는 위에서 이미 생성)

  // Q7. 멘토링 주제
  form.addCheckboxItem()
    .setTitle("7. 어떤 주제로 멘토링이 가능한가요? (복수 선택)")
    .setChoiceValues([
      "취업 / 이직 상담",
      "포트폴리오 리뷰",
      "이력서 / 자소서 피드백",
      "면접 준비 (기술면접, 인성면접)",
      "실무 스킬 조언",
      "커리어 방향 설정",
      "업계 트렌드 / 회사 정보",
      "직무 전환 상담 (예: 기획→PM)",
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Q8. 대상
  form.addCheckboxItem()
    .setTitle("8. 주로 어떤 대상에게 도움을 줄 수 있나요? (복수 선택)")
    .setChoiceValues([
      "게임업계 취준생",
      "타 업계 → 게임업계 이직 희망자",
      "주니어 (1~3년차)",
      "같은 직군 후배",
      "비전공자",
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ─── 섹션 4: 선호 방식과 조건 ───
  form.addSectionHeaderItem()
    .setTitle("⏰ 선호하는 방식과 조건")
    .setHelpText("멘토링을 어떤 형태로 진행하고 싶은지 알려주세요.");

  // Q9. 멘토링 방식
  form.addCheckboxItem()
    .setTitle("9. 선호하는 멘토링 방식은? (복수 선택)")
    .setChoiceValues([
      "1:1 화상 (Zoom/Google Meet 등)",
      "1:1 대면",
      "텍스트 채팅 (카톡/디스코드 등)",
      "이메일 / 서면 피드백",
      "그룹 세션 (2~4명)",
    ])
    .setRequired(true);

  // Q10. 시간
  form.addMultipleChoiceItem()
    .setTitle("10. 1회 멘토링에 적당하다고 생각하는 시간은?")
    .setChoiceValues([
      "15~20분 (가볍게)",
      "30분",
      "45~60분",
      "상관없다",
    ])
    .setRequired(true);

  // Q11. 빈도
  form.addMultipleChoiceItem()
    .setTitle("11. 월 몇 회 정도 멘토링이 가능한가요?")
    .setChoiceValues([
      "1~2회",
      "3~4회",
      "5회 이상",
      "불규칙하게 가능할 때만",
    ])
    .setRequired(true);

  // Q12. 시간대
  form.addCheckboxItem()
    .setTitle("12. 선호하는 시간대는? (복수 선택)")
    .setChoiceValues([
      "평일 오전 (9~12시)",
      "평일 점심 (12~14시)",
      "평일 저녁 (18시 이후)",
      "주말 오전",
      "주말 오후",
    ])
    .setRequired(true);

  // ─── 섹션 5: 보상과 동기 ───
  form.addSectionHeaderItem()
    .setTitle("💰 보상과 동기")
    .setHelpText("멘토링 참여 동기와 보상에 대한 기대를 알려주세요.");

  // Q13. 동기
  form.addCheckboxItem()
    .setTitle("13. 멘토링의 주요 동기는? (복수 선택)")
    .setChoiceValues([
      "후배 양성 / 업계 기여",
      "부수입",
      "네트워킹 확대",
      "개인 브랜딩 / 인지도",
      "가르치면서 나도 배우는 것",
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Q14. 적정 보상
  form.addMultipleChoiceItem()
    .setTitle("14. 1회(30분 기준) 적정 보상 금액은?")
    .setChoiceValues([
      "무료 (재능기부)",
      "1~2만원",
      "3~5만원",
      "5만원 이상",
      "잘 모르겠다",
    ])
    .setRequired(true);

  // Q15. 보상 방식
  form.addMultipleChoiceItem()
    .setTitle("15. 어떤 보상 방식을 선호하나요?")
    .setChoiceValues([
      "건당 정산 (멘토링 1회마다)",
      "월 정기 정산",
      "플랫폼 포인트 / 크레딧",
      "상관없다",
    ])
    .setRequired(true);

  // ─── 섹션 6: 플랫폼 기대사항 ───
  form.addSectionHeaderItem()
    .setTitle("✨ 플랫폼에 바라는 점")
    .setHelpText("마지막이에요! 커피챗에 기대하는 점을 알려주세요.");

  // Q16. 중요 요소
  form.addCheckboxItem()
    .setTitle("16. 멘토링 플랫폼에서 가장 중요한 것은? (최대 2개)")
    .setChoiceValues([
      "멘티 매칭 품질 (준비된 멘티 연결)",
      "간편한 일정 관리",
      "정당한 보상",
      "멘티 노쇼 방지 장치",
      "플랫폼 신뢰도 / 인지도",
    ])
    .setRequired(true);

  // Q17. 우려사항
  form.addCheckboxItem()
    .setTitle("17. 멘토로 활동할 때 우려되는 점이 있나요? (복수 선택)")
    .setChoiceValues([
      "시간 부담",
      "보상이 낮을까 걱정",
      "멘티 태도 / 준비 부족",
      "회사에 알려질까 걱정",
      "특별히 없다",
    ])
    .setRequired(true);

  // Q18. 자유 의견
  form.addParagraphTextItem()
    .setTitle("18. 추가로 하고 싶은 말이 있다면 자유롭게 적어주세요")
    .setHelpText("커피챗에 바라는 점, 아이디어, 궁금한 점 뭐든 좋습니다!")
    .setRequired(false);

  // ─── 완료 ───
  Logger.log("✅ 설문 생성 완료!");
  Logger.log("📋 폼 편집 URL: " + form.getEditUrl());
  Logger.log("🔗 폼 응답 URL: " + form.getPublishedUrl());
  Logger.log("📊 응답 스프레드시트는 폼 편집 화면에서 '응답' 탭 → 스프레드시트 아이콘으로 연결하세요.");
}
