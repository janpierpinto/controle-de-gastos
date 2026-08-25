package com.controledegastos.reports.web;

import com.controledegastos.reports.application.ReportService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private static final DateTimeFormatter FILENAME_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping(value = "/monthly", produces = "application/pdf")
    public ResponseEntity<byte[]> monthly(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        var pdf = reportService.monthlyReport(month);
        var filename = "relatorio-" + FILENAME_MONTH_FORMAT.format(month.withDayOfMonth(1)) + ".pdf";
        var headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(pdf);
    }
}
